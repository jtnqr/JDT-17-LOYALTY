package com.jdt17.loyalty.scheduler;

import com.jdt17.loyalty.service.TransactionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PointExpirySchedulerTest {

    @Mock
    private TransactionService transactionService;

    @InjectMocks
    private PointExpiryScheduler scheduler;

    @Test
    void testRunPointExpiry_Success() {
        doNothing().when(transactionService).expirePoints();
        scheduler.runPointExpiry();
        verify(transactionService).expirePoints();
    }

    @Test
    void testRunPointExpiry_Exception() {
        doThrow(new RuntimeException("scheduler error")).when(transactionService).expirePoints();
        scheduler.runPointExpiry(); // should catch exception and not rethrow
        verify(transactionService).expirePoints();
    }
}
