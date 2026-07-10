package com.jdt17.loyalty.config;

import com.jdt17.loyalty.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable) // Nonaktifkan CSRF untuk mempermudah testing request POST
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/members/{id}/points").hasRole("MEMBER")
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/members/{id}/transactions").hasRole("MEMBER")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/exchange").hasRole("MEMBER")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/redeem").hasRole("MEMBER")
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/rewards").hasAnyRole("MEMBER", "ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/members/{id}").hasAnyRole("MEMBER", "ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/v1/members/{id}").hasRole("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/members").hasRole("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/exchange-rates").hasAnyRole("MEMBER", "ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/exchange-rates").hasRole("ADMIN")
                        .anyRequest().authenticated()
                ).addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10); // Bean PasswordEncoder yang dibutuhkan oleh MemberService
    }
}
