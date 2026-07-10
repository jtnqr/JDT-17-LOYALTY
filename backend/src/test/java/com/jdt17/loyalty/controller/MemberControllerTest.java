package com.jdt17.loyalty.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jdt17.loyalty.dto.member.MemberPointsResponse;
import com.jdt17.loyalty.dto.member.MemberResponse;
import com.jdt17.loyalty.dto.member.PagedMemberResponse;
import com.jdt17.loyalty.dto.member.UpdateMemberRequest;
import com.jdt17.loyalty.service.MemberService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MemberControllerTest {

    private MockMvc mockMvc;

    @Mock
    private MemberService memberService;

    @InjectMocks
    private MemberController memberController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(memberController).build();
    }

    @Test
    void testGetAllMembers() throws Exception {
        UUID memberId = UUID.randomUUID();
        MemberResponse memberResponse = MemberResponse.builder()
                .id(memberId)
                .name("Budi")
                .email("budi@example.com")
                .status("ACTIVE")
                .build();

        PagedMemberResponse response = PagedMemberResponse.builder()
                .data(List.of(memberResponse))
                .page(0)
                .size(20)
                .total(1L)
                .build();

        when(memberService.getAllMembers(0, 20, "ACTIVE")).thenReturn(response);

        mockMvc.perform(get("/api/v1/members")
                        .param("page", "0")
                        .param("size", "20")
                        .param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(memberId.toString()))
                .andExpect(jsonPath("$.data[0].name").value("Budi"))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void testGetMemberById() throws Exception {
        UUID memberId = UUID.randomUUID();
        MemberResponse response = MemberResponse.builder()
                .id(memberId)
                .name("Budi")
                .email("budi@example.com")
                .status("ACTIVE")
                .build();

        when(memberService.getMemberById(memberId)).thenReturn(response);

        mockMvc.perform(get("/api/v1/members/{id}", memberId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(memberId.toString()))
                .andExpect(jsonPath("$.name").value("Budi"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void testUpdateMember() throws Exception {
        UUID memberId = UUID.randomUUID();
        UpdateMemberRequest request = UpdateMemberRequest.builder()
                .name("Budi S.")
                .phone("089876543210")
                .status("INACTIVE")
                .build();

        MemberResponse response = MemberResponse.builder()
                .id(memberId)
                .name("Budi S.")
                .email("budi@example.com")
                .phone("089876543210")
                .status("INACTIVE")
                .build();

        when(memberService.updateMember(eq(memberId), any(UpdateMemberRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/members/{id}", memberId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(memberId.toString()))
                .andExpect(jsonPath("$.name").value("Budi S."))
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }

    @Test
    void testGetMemberPoints_Success() throws Exception {
        UUID memberId = UUID.randomUUID();
        UUID partnerId1 = UUID.randomUUID();
        UUID partnerId2 = UUID.randomUUID();

        MemberPointsResponse.PointBalanceDetail detail1 = MemberPointsResponse.PointBalanceDetail.builder()
                .partnerId(partnerId1)
                .partnerName("KFC Indonesia")
                .balance(500L)
                .build();

        MemberPointsResponse.PointBalanceDetail detail2 = MemberPointsResponse.PointBalanceDetail.builder()
                .partnerId(partnerId2)
                .partnerName("McDonald's Indonesia")
                .balance(300L)
                .build();

        MemberPointsResponse response = MemberPointsResponse.builder()
                .memberId(memberId)
                .memberName("Budi Santoso")
                .balances(List.of(detail1, detail2))
                .build();

        when(memberService.getMemberPoints(memberId)).thenReturn(response);

        mockMvc.perform(get("/api/v1/members/{id}/points", memberId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memberId").value(memberId.toString()))
                .andExpect(jsonPath("$.memberName").value("Budi Santoso"))
                .andExpect(jsonPath("$.balances[0].partnerName").value("KFC Indonesia"))
                .andExpect(jsonPath("$.balances[0].balance").value(500))
                .andExpect(jsonPath("$.balances[1].partnerName").value("McDonald's Indonesia"))
                .andExpect(jsonPath("$.balances[1].balance").value(300));
    }
}
