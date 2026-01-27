package com.ims.api.controller;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ims.api.model.Item;
import com.ims.api.model.SalesRecord;
import com.ims.api.repository.ItemRepository;
import com.ims.api.repository.SalesRecordRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private SalesRecordRepository salesRecordRepository;

    @GetMapping
    public ResponseEntity<?> getAllItems() {
        try {
            System.out.println("Fetching all items from MongoDB database: ims_db_1");
            List<Item> items = itemRepository.findAll();
            System.out.println("Found " + items.size() + " items in the database");
            
            if (items.isEmpty()) {
                System.out.println("No items found in database. Returning empty list.");
            } else {
                for (Item item : items) {
                    System.out.println("Item: " + item.getName() + ", ID: " + item.getId() + ", Category: " + item.getCategory());
                }
            }
            
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            System.err.println("Error fetching items from MongoDB: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("error", "Failed to retrieve items: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getItemById(@PathVariable String id) {
        try {
            System.out.println("Fetching item with ID: " + id);
            return itemRepository.findById(id)
                    .map(item -> {
                        System.out.println("Found item: " + item.getName());
                        return ResponseEntity.ok(item);
                    })
                    .orElseGet(() -> {
                        System.out.println("Item not found with ID: " + id);
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            System.err.println("Error fetching item with ID " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("error", "Failed to retrieve item: " + e.getMessage()));
        }
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<?> getItemsByCategory(@PathVariable String category) {
        try {
            System.out.println("Fetching items with category: " + category);
            List<Item> items = itemRepository.findByCategory(category);
            System.out.println("Found " + items.size() + " items in category: " + category);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            System.err.println("Error fetching items by category " + category + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("error", "Failed to retrieve items by category: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createItem(@RequestBody Item item) {
        try {
            System.out.println("Creating new item: " + item.getName());
            
            if (itemRepository.existsByName(item.getName())) {
                System.out.println("Item with name " + item.getName() + " already exists");
                return ResponseEntity.badRequest()
                    .body(Collections.singletonMap("error", "Item with this name already exists"));
            }
            
            // Ensure fields are properly set
            if (item.getLastUpdated() == null) {
                item.setLastUpdated(LocalDateTime.now());
            }
            
            // Initialize sales to 0 if not already set
            item.setSales(0);
            
            Item savedItem = itemRepository.save(item);
            System.out.println("Item created successfully with ID: " + savedItem.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(savedItem);
        } catch (Exception e) {
            System.err.println("Error creating item: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("error", "Failed to create item: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateItem(@PathVariable String id, @Valid @RequestBody Item itemDetails) {
        try {
            System.out.println("Updating item with ID: " + id);
            System.out.println("Received item details: " + itemDetails);
            
            return itemRepository.findById(id)
                    .map(item -> {
                        item.setName(itemDetails.getName());
                        item.setCategory(itemDetails.getCategory());
                        item.setQuantity(itemDetails.getQuantity());
                        item.setMinStock(itemDetails.getMinStock());
                        item.setImageUrl(itemDetails.getImageUrl());
                        
                        // Make sure to update the price
                        if (itemDetails.getPrice() > 0) {
                            System.out.println("Updating price from " + item.getPrice() + " to " + itemDetails.getPrice());
                            item.setPrice(itemDetails.getPrice());
                        }
                        
                        // Set description if provided
                        if (itemDetails.getDescription() != null) {
                            item.setDescription(itemDetails.getDescription());
                        }
                        
                        item.setLastUpdated(LocalDateTime.now());
                        Item updatedItem = itemRepository.save(item);
                        System.out.println("Item updated successfully: " + updatedItem.getName() + " with price: " + updatedItem.getPrice());
                        return ResponseEntity.ok(updatedItem);
                    })
                    .orElseGet(() -> {
                        System.out.println("Item not found with ID: " + id);
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            System.err.println("Error updating item with ID " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("error", "Failed to update item: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/quantity")
    public ResponseEntity<?> updateQuantity(@PathVariable String id, @RequestBody Map<String, Integer> update) {
        try {
            Integer quantityToAdd = update.get("quantity");
            System.out.println("Updating quantity for item ID " + id + " by " + quantityToAdd);
            
            if (quantityToAdd == null) {
                System.out.println("Invalid request - quantity parameter is missing");
                return ResponseEntity.badRequest()
                    .body(Collections.singletonMap("error", "Quantity parameter is required"));
            }
            
            return itemRepository.findById(id)
                    .map(item -> {
                        int newQuantity = item.getQuantity() + quantityToAdd;
                        if (newQuantity < 0) {
                            System.out.println("Invalid quantity - would result in negative stock");
                            return ResponseEntity.badRequest()
                                .body(Collections.singletonMap("error", "Cannot reduce quantity below zero"));
                        }
                        
                        item.setQuantity(newQuantity);
                        item.setLastUpdated(LocalDateTime.now());
                        Item updatedItem = itemRepository.save(item);
                        System.out.println("Quantity updated successfully. New quantity: " + updatedItem.getQuantity());
                        return ResponseEntity.ok(updatedItem);
                    })
                    .orElseGet(() -> {
                        System.out.println("Item not found with ID: " + id);
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            System.err.println("Error updating quantity for item " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("error", "Failed to update quantity: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/sell")
    public ResponseEntity<?> sellItem(@PathVariable String id, @RequestBody Map<String, Integer> saleInfo) {
        try {
            Integer quantityToSell = saleInfo.get("quantity");
            System.out.println("Selling item with ID " + id + ", quantity: " + quantityToSell);
            
            if (quantityToSell == null || quantityToSell <= 0) {
                System.out.println("Invalid quantity for sale: " + quantityToSell);
                return ResponseEntity.badRequest()
                    .body(Collections.singletonMap("error", "Invalid quantity"));
            }
            
            return itemRepository.findById(id)
                    .map(item -> {
                        if (item.getQuantity() < quantityToSell) {
                            System.out.println("Not enough stock available. Current: " + item.getQuantity() + ", Requested: " + quantityToSell);
                            return ResponseEntity.badRequest()
                                .body(Collections.singletonMap("error", "Not enough stock available"));
                        }
                        
                        item.setQuantity(item.getQuantity() - quantityToSell);
                        item.incrementSales(quantityToSell);
                        item.setLastUpdated(LocalDateTime.now());
                        Item updatedItem = itemRepository.save(item);
                        
                        // Record the sale
                        SalesRecord salesRecord = new SalesRecord(
                                item.getId(),
                                item.getName(),
                                item.getCategory(),
                                quantityToSell,
                                item.getPrice()
                        );
                        salesRecordRepository.save(salesRecord);
                        
                        System.out.println("Item sold successfully. New quantity: " + updatedItem.getQuantity());
                        return ResponseEntity.ok(updatedItem);
                    })
                    .orElseGet(() -> {
                        System.out.println("Item not found with ID: " + id);
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            System.err.println("Error selling item " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("error", "Failed to process sale: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteItem(@PathVariable String id) {
        try {
            System.out.println("Deleting item with ID: " + id);
            return itemRepository.findById(id)
                    .map(item -> {
                        itemRepository.delete(item);
                        System.out.println("Item deleted successfully: " + item.getName());
                        return ResponseEntity.ok().build();
                    })
                    .orElseGet(() -> {
                        System.out.println("Item not found with ID: " + id);
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            System.err.println("Error deleting item " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("error", "Failed to delete item: " + e.getMessage()));
        }
    }

    @PatchMapping("/update-prices")
    public ResponseEntity<?> updateAllItemPrices() {
        try {
            System.out.println("Updating all item prices");
            List<Item> items = itemRepository.findAll();
            Map<String, Double> categoryPrices = new HashMap<>();
            
            // Define default prices by category
            categoryPrices.put("Electronics", 15000.00);
            categoryPrices.put("Furniture", 7500.00);
            categoryPrices.put("Stationery", 150.00);
            categoryPrices.put("Office Supplies", 350.00);
            
            // Define specific prices for common items
            Map<String, Double> itemPrices = new HashMap<>();
            itemPrices.put("Laptop", 45000.00);
            itemPrices.put("Smartphone", 25000.00);
            itemPrices.put("Wireless Mouse", 1200.00);
            itemPrices.put("Ergonomic Keyboard", 2500.00);
            itemPrices.put("Office Chair", 7500.00);
            itemPrices.put("Desk", 12000.00);
            itemPrices.put("Filing Cabinet", 5500.00);
            itemPrices.put("Bookshelf", 8000.00);
            itemPrices.put("Notebook", 150.00);
            itemPrices.put("Pens (Box)", 120.00);
            itemPrices.put("Sticky Notes", 80.00);
            itemPrices.put("Desk Lamp", 850.00);
            itemPrices.put("Scissors", 95.00);
            itemPrices.put("Staplers", 175.00);
            
            int updatedCount = 0;
            
            for (Item item : items) {
                if (item.getPrice() == 0.0) {
                    // Check for specific item price
                    if (itemPrices.containsKey(item.getName())) {
                        item.setPrice(itemPrices.get(item.getName()));
                    } else if (categoryPrices.containsKey(item.getCategory())) {
                        // Use category default price
                        item.setPrice(categoryPrices.get(item.getCategory()));
                    } else {
                        // Fallback price
                        item.setPrice(500.00);
                    }
                    updatedCount++;
                }
            }
            
            itemRepository.saveAll(items);
            System.out.println(updatedCount + " items updated with prices");
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", updatedCount + " items updated with prices"
            ));
        } catch (Exception e) {
            System.err.println("Error updating prices: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to update prices", "message", e.getMessage()));
        }
    }
} 