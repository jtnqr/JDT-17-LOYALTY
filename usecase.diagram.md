# Use Case Diagram

Diagram Use Case ini merepresentasikan aktor-aktor yang berinteraksi dengan platform JDT-17-LOYALTY beserta Use Case apa saja yang dapat mereka lakukan, sesuai dengan Functional Specification Document (FSD).

```mermaid
flowchart LR
    %% Definition of Actors
    A1((Member))
    A2((CMS Admin))
    A3((Partner System))
    A4((System Scheduler))
    
    %% System Boundary
    subgraph "JDT-17-LOYALTY Platform"
        UC1([UC-01: Member Registration])
        UC2([UC-02: Partner Master Management])
        UC3([UC-03: Point Accumulation])
        UC4([UC-04: Point Expiry])
        UC5([UC-05: Point Exchange Between Partners])
        UC7([UC-07: View Transaction History])
        UC8([UC-08: View Point Balance])
    end
    
    %% Relationship - Member
    A1 --- UC1
    A1 --- UC5
    A1 --- UC7
    A1 --- UC8
    
    %% Relationship - Admin
    A2 --- UC1
    A2 --- UC2
    
    %% Relationship - Partner System
    A3 --- UC3
    
    %% Relationship - System Scheduler
    A4 --- UC4
    
    classDef actor fill:#f9f9f9,stroke:#333,stroke-width:2px;
    class A1,A2,A3,A4 actor;
```
