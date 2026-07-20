package com.jdt17.loyalty.controller;

import com.jdt17.loyalty.dto.admin.AdminDashboardStatsResponse;
import com.jdt17.loyalty.service.AdminDashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminDashboardControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AdminDashboardService adminDashboardService;

    @InjectMocks
    private AdminDashboardController adminDashboardController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminDashboardController).build();
    }

    @Test
    void testGetDashboardStats_Success() throws Exception {
        AdminDashboardStatsResponse response = AdminDashboardStatsResponse.builder()
                .totalMembers(100L)
                .activeMembers(90L)
                .inactiveMembers(10L)
                .build();

        when(adminDashboardService.getDashboardStats()).thenReturn(response);

        mockMvc.perform(get("/api/v1/admin/dashboard-stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalMembers").value(100))
                .andExpect(jsonPath("$.activeMembers").value(90))
                .andExpect(jsonPath("$.inactiveMembers").value(10));
    }
}
