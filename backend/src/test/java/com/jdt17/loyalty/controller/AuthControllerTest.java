package com.jdt17.loyalty.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jdt17.loyalty.dto.login.LoginRequest;
import com.jdt17.loyalty.dto.login.LoginResponse;
import com.jdt17.loyalty.dto.partner.PartnerTokenRequest;
import com.jdt17.loyalty.dto.partner.PartnerTokenResponse;
import com.jdt17.loyalty.dto.register.RegisterRequest;
import com.jdt17.loyalty.dto.register.RegisterResponse;
import com.jdt17.loyalty.service.MemberService;
import com.jdt17.loyalty.service.PartnerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private MemberService memberService;

    @Mock
    private PartnerService partnerService;

    @InjectMocks
    private AuthController authController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    @Test
    void testRegister() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("Budi")
                .email("budi@example.com")
                .phone("081234567890")
                .password("Member123!")
                .build();

        RegisterResponse response = RegisterResponse.builder()
                .token("mockedToken")
                .role("MEMBER")
                .build();

        when(memberService.registerMember(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("mockedToken"))
                .andExpect(jsonPath("$.role").value("MEMBER"));
    }

    @Test
    void testLogin() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("budi@example.com")
                .password("Member123!")
                .build();

        LoginResponse response = LoginResponse.builder()
                .token("mockedToken")
                .role("MEMBER")
                .build();

        when(memberService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mockedToken"))
                .andExpect(jsonPath("$.role").value("MEMBER"));
    }

    @Test
    void testGetPartnerToken() throws Exception {
        PartnerTokenRequest request = PartnerTokenRequest.builder()
                .partnerId(UUID.randomUUID())
                .apiKey("kfc_key")
                .build();

        PartnerTokenResponse response = PartnerTokenResponse.builder()
                .token("mockedPartnerToken")
                .expiresIn(3600)
                .build();

        when(partnerService.getPartnerToken(any(PartnerTokenRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/partner/token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mockedPartnerToken"))
                .andExpect(jsonPath("$.expiresIn").value(3600));
    }
}
