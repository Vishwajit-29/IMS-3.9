package com.ims.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.ims.api.model.Item;

@Repository
public interface ItemRepository extends MongoRepository<Item, String> {
    
    List<Item> findByCategory(String category);
    
    Optional<Item> findByName(String name);
    
    List<Item> findByQuantityLessThanEqualAndMinStockGreaterThanEqual(int quantity, int minStock);
    
    Boolean existsByName(String name);
} 