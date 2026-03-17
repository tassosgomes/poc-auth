package com.zcorp.ordersservice.security;

import java.util.Collection;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.zcorp.ordersservice.OrdersServiceProperties;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, CorrelationIdFilter correlationIdFilter, JwtAuthenticationConverterAdapter converter) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(resourceServer -> resourceServer
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(converter::convert))
                        .authenticationEntryPoint((request, response, exception) -> {
                            ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Authentication is required");
                            problemDetail.setTitle(HttpStatus.UNAUTHORIZED.getReasonPhrase());
                            problemDetail.setProperty("code", "AUTHENTICATION_REQUIRED");
                            problemDetail.setProperty("correlationId", request.getAttribute("correlationId"));
                            response.setStatus(HttpStatus.UNAUTHORIZED.value());
                            response.setContentType("application/problem+json");
                            response.getWriter().write(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(problemDetail));
                        }))
                .exceptionHandling(exceptionHandling -> exceptionHandling
                        .accessDeniedHandler((request, response, exception) -> {
                            ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, "Access denied");
                            problemDetail.setTitle(HttpStatus.FORBIDDEN.getReasonPhrase());
                            problemDetail.setProperty("code", "FORBIDDEN");
                            problemDetail.setProperty("correlationId", request.getAttribute("correlationId"));
                            response.setStatus(HttpStatus.FORBIDDEN.value());
                            response.setContentType("application/problem+json");
                            response.getWriter().write(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(problemDetail));
                        }))
                .httpBasic(Customizer.withDefaults());

        http.addFilterBefore(correlationIdFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    JwtDecoder jwtDecoder(OrdersServiceProperties properties) {
        NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withJwkSetUri(properties.security().jwkSetUri()).build();
        OAuth2TokenValidator<Jwt> validator = new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(properties.security().issuerUri()),
                new AudienceValidator(properties.security().audience()),
                new RolesClaimValidator(properties.security().rolesClaim()));
        jwtDecoder.setJwtValidator(validator);
        return jwtDecoder;
    }

    @Bean
    JwtAuthenticationConverterAdapter jwtAuthenticationConverterAdapter(JwtClaimsAdapter jwtClaimsAdapter) {
        return new JwtAuthenticationConverterAdapter(jwtClaimsAdapter);
    }

    @Bean
    RedisConnectionFactory redisConnectionFactory(OrdersServiceProperties properties) {
        java.net.URI redisUri = java.net.URI.create(properties.redisUrl());
        RedisStandaloneConfiguration configuration = new RedisStandaloneConfiguration(redisUri.getHost(), redisUri.getPort());

        if (redisUri.getUserInfo() != null && redisUri.getUserInfo().contains(":")) {
            String[] userInfo = redisUri.getUserInfo().split(":", 2);
            if (!userInfo[0].isBlank()) {
                configuration.setUsername(userInfo[0]);
            }
            if (userInfo.length > 1 && !userInfo[1].isBlank()) {
                configuration.setPassword(userInfo[1]);
            }
        }

        if (redisUri.getPath() != null && redisUri.getPath().length() > 1) {
            configuration.setDatabase(Integer.parseInt(redisUri.getPath().substring(1)));
        }

        LettuceClientConfiguration clientConfiguration = redisUri.getScheme().equalsIgnoreCase("rediss")
                ? LettuceClientConfiguration.builder().useSsl().build()
                : LettuceClientConfiguration.builder().build();

        return new LettuceConnectionFactory(configuration, clientConfiguration);
    }

    @Bean
    StringRedisTemplate stringRedisTemplate(RedisConnectionFactory redisConnectionFactory) {
        return new StringRedisTemplate(redisConnectionFactory);
    }

    static final class JwtAuthenticationConverterAdapter {

        private final JwtClaimsAdapter jwtClaimsAdapter;

        JwtAuthenticationConverterAdapter(JwtClaimsAdapter jwtClaimsAdapter) {
            this.jwtClaimsAdapter = jwtClaimsAdapter;
        }

        AbstractAuthenticationToken convert(Jwt jwt) {
            Collection<GrantedAuthority> authorities = jwtClaimsAdapter.extractRoles(jwt).stream()
                    .map(role -> new SimpleGrantedAuthority("role:" + role))
                    .map(GrantedAuthority.class::cast)
                    .toList();
            return new JwtAuthenticationToken(jwt, List.copyOf(authorities));
        }
    }
}