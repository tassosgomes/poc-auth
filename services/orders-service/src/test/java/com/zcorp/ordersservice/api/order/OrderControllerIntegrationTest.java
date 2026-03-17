package com.zcorp.ordersservice.api.order;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;

import com.zcorp.ordersservice.security.RoleAccessGateway;
import com.zcorp.ordersservice.security.RoleAccessRecord;

@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerIntegrationTest {

    private static MockWebServer mockWebServer;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoleAccessGateway roleAccessGateway;

    @DynamicPropertySource
    static void registerDynamicProperties(DynamicPropertyRegistry registry) throws IOException {
        mockWebServer = new MockWebServer();
                mockWebServer.setDispatcher(new okhttp3.mockwebserver.Dispatcher() {
                        @Override
                        public MockResponse dispatch(okhttp3.mockwebserver.RecordedRequest request) {
                                return new MockResponse()
                                                .setHeader("Content-Type", "application/json")
                                                .setBody(SecurityIntegrationTestSupport.jwksBody());
                        }
                });
        mockWebServer.start();

        registry.add("orders-service.security.issuer-uri", () -> mockWebServer.url("/issuer").toString().replaceAll("/$", ""));
        registry.add("orders-service.security.jwk-set-uri", () -> mockWebServer.url("/.well-known/jwks.json").toString());
        registry.add("orders-service.security.audience", () -> "orders-service");
        registry.add("orders-service.authz.local-cache-ttl", () -> "PT1S");
    }

    @AfterAll
    static void tearDown() throws IOException {
        if (mockWebServer != null) {
            mockWebServer.shutdown();
        }
    }

    @BeforeEach
    void setUp() {
        when(roleAccessGateway.getRoleAccess("tecnico"))
                .thenReturn(Optional.of(new RoleAccessRecord("tecnico", java.util.Set.of("ordens:view"), 1)));
        when(roleAccessGateway.getRoleAccess("admin"))
                .thenReturn(Optional.of(new RoleAccessRecord("admin", java.util.Set.of("ordens:view", "ordens:create"), 2)));
        when(roleAccessGateway.getRoleAccess("coordenador"))
                .thenReturn(Optional.of(new RoleAccessRecord("coordenador", java.util.Set.of("ordens:view", "ordens:create"), 1)));
    }

    @Test
    void listOrders_WithValidJwtAndPermission_ShouldReturnOk() throws Exception {
        String token = SecurityIntegrationTestSupport.createToken(
                mockWebServer.url("/issuer").toString().replaceAll("/$", ""),
                "orders-service",
                List.of("tecnico"));

        mockMvc.perform(get("/orders/v1/orders")
                        .header("Authorization", "Bearer " + token)
                        .header("x-correlation-id", "corr-123"))
                .andExpect(status().isOk())
                .andExpect(header().string("x-correlation-id", "corr-123"))
                .andExpect(jsonPath("$[0].code").value("OS-100001"));
    }

    @Test
    void createOrder_WithoutEffectivePermission_ShouldReturnForbidden() throws Exception {
        String token = SecurityIntegrationTestSupport.createToken(
                mockWebServer.url("/issuer").toString().replaceAll("/$", ""),
                "orders-service",
                List.of("tecnico"));

        mockMvc.perform(post("/orders/v1/orders")
                        .header("Authorization", "Bearer " + token)
                        .header("x-correlation-id", "corr-456")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "customerName": "Daniel Costa",
                                  "description": "Schedule a field visit"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(header().string("x-correlation-id", "corr-456"))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.permission").value("ordens:create"));
    }

    @Test
    void createOrder_WithValidJwtAndPermission_ShouldReturnCreated() throws Exception {
        String token = SecurityIntegrationTestSupport.createToken(
                mockWebServer.url("/issuer").toString().replaceAll("/$", ""),
                "orders-service",
                List.of("admin"));

        mockMvc.perform(post("/orders/v1/orders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "customerName": "Daniel Costa",
                                  "description": "Schedule a field visit"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/orders/v1/orders/2001"))
                .andExpect(jsonPath("$.customerName").value("Daniel Costa"))
                .andExpect(jsonPath("$.status").value("CREATED"));
    }

    @Test
    void listOrders_WithInvalidAudience_ShouldReturnUnauthorized() throws Exception {
        String token = SecurityIntegrationTestSupport.createToken(
                mockWebServer.url("/issuer").toString().replaceAll("/$", ""),
                "another-service",
                List.of("tecnico"));

        mockMvc.perform(get("/orders/v1/orders")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.properties.code").value("AUTHENTICATION_REQUIRED"));
    }

    @Test
    void listOrders_WithMalformedRolesClaim_ShouldReturnUnauthorized() throws Exception {
        String token = SecurityIntegrationTestSupport.createToken(
                mockWebServer.url("/issuer").toString().replaceAll("/$", ""),
                "orders-service",
                "admin");

        mockMvc.perform(get("/orders/v1/orders")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.properties.code").value("AUTHENTICATION_REQUIRED"));
    }

}