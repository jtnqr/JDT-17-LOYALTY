package com.jdt17.loyalty.config;

import com.jdt17.loyalty.constant.RoleConstant;
import com.jdt17.loyalty.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable) // Nonaktifkan CSRF untuk mempermudah testing request POST
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/members/{id}/points").hasRole(RoleConstant.MEMBER)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/members/{id}/transactions").hasRole(RoleConstant.MEMBER)
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/exchange").hasRole(RoleConstant.MEMBER)
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/redeem").hasRole(RoleConstant.MEMBER)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/rewards").hasAnyRole(RoleConstant.MEMBER, RoleConstant.ADMIN)
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/rewards").hasRole(RoleConstant.ADMIN)
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/v1/rewards/**").hasRole(RoleConstant.ADMIN)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/members/{id}").hasAnyRole(RoleConstant.MEMBER, RoleConstant.ADMIN)
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/v1/members/{id}").hasRole(RoleConstant.ADMIN)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/members").hasRole(RoleConstant.ADMIN)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/admin/dashboard-stats").hasRole(RoleConstant.ADMIN)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/exchange-rates").hasAnyRole(RoleConstant.MEMBER, RoleConstant.ADMIN)
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/exchange-rates").hasRole(RoleConstant.ADMIN)
                        .anyRequest().authenticated()
                ).addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10); // Bean PasswordEncoder yang dibutuhkan oleh MemberService
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/v1/**", configuration);
        return source;
    }
}
