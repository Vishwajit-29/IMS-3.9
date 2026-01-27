package com.ims.api.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.ims.api.model.SalesRecord;

@Repository
public interface SalesRecordRepository extends MongoRepository<SalesRecord, String> {
    
    List<SalesRecord> findByItemId(String itemId);
    
    List<SalesRecord> findByItemIdOrderByTimestampDesc(String itemId);
    
    List<SalesRecord> findByItemName(String itemName);
    
    List<SalesRecord> findByCategory(String category);
    
    List<SalesRecord> findByTimestampBetween(LocalDateTime start, LocalDateTime end);
    
    List<SalesRecord> findByItemIdAndTimestampBetween(String itemId, LocalDateTime start, LocalDateTime end);
} 