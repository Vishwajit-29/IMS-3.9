package com.inventory.controllers;

import com.ims.api.model.Item;
import com.ims.api.model.SalesRecord;
import com.ims.api.repository.ItemRepository;
import com.ims.api.repository.SalesRecordRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private static final Logger logger = LoggerFactory.getLogger(ItemController.class);

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private SalesRecordRepository salesRecordRepository;

    @PostMapping("/{id}/sell")
    public ResponseEntity<?> sellItem(@PathVariable String id, @RequestBody Map<String, Integer> request) {
        try {
            Integer quantity = request.get("quantity");
            if (quantity == null || quantity <= 0) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Invalid quantity"));
            }

            logger.info("Selling {} units of item with ID: {}", quantity, id);
            Optional<Item> itemOpt = itemRepository.findById(id);
            if (!itemOpt.isPresent()) {
                logger.warn("Item not found with ID: {}", id);
                return ResponseEntity.notFound().build();
            }

            Item item = itemOpt.get();
            if (item.getQuantity() < quantity) {
                logger.warn("Not enough items in stock. Requested: {}, Available: {}", quantity, item.getQuantity());
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Not enough items in stock"));
            }

            // Update item quantity
            item.setQuantity(item.getQuantity() - quantity);
            
            // Increment sales counter
            item.incrementSales(quantity);
            
            Item updatedItem = itemRepository.save(item);
            logger.info("Item quantity updated. New quantity: {}", updatedItem.getQuantity());

            // Create a sales record
            SalesRecord salesRecord = new SalesRecord(
                id, 
                item.getName(),
                item.getCategory(),
                quantity
            );
            salesRecordRepository.save(salesRecord);
            logger.info("Sales record created with ID: {}", salesRecord.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Item sold successfully");
            response.put("item", updatedItem);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error selling item: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Failed to sell item: " + e.getMessage()));
        }
    }
} 