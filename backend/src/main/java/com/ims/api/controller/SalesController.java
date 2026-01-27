package com.ims.api.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ims.api.model.Item;
import com.ims.api.model.SalesRecord;
import com.ims.api.repository.ItemRepository;
import com.ims.api.repository.SalesRecordRepository;

@RestController
@RequestMapping("/api/sales")
public class SalesController {

    @Autowired
    private SalesRecordRepository salesRecordRepository;

    @Autowired
    private ItemRepository itemRepository;

    @GetMapping
    public ResponseEntity<?> getSalesData() {
        try {
            System.out.println("Fetching sales data from MongoDB");
            Map<String, Object> salesData = new HashMap<>();

            // Get weekly sales (for past week)
            List<Map<String, Object>> weeklySales = new ArrayList<>();
            // Hardcode some sample data for now
            String[] days = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};
            for (String day : days) {
                Map<String, Object> daySales = new HashMap<>();
                daySales.put("day", day);
                daySales.put("sales", Math.floor(Math.random() * 30));
                weeklySales.add(daySales);
            }
            salesData.put("weeklySales", weeklySales);

            // Get monthly sales (for the year)
            List<Map<String, Object>> monthlySales = new ArrayList<>();
            String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
            for (String month : months) {
                Map<String, Object> monthSales = new HashMap<>();
                monthSales.put("month", month);
                monthSales.put("sales", Math.floor(Math.random() * 500) + 200);
                monthlySales.add(monthSales);
            }
            salesData.put("monthlySales", monthlySales);

            // Get top selling items
            List<Item> topSellingItems = itemRepository.findAll().stream()
                .sorted((i1, i2) -> Integer.compare(i2.getSales(), i1.getSales()))
                .limit(5)
                .toList();
            salesData.put("topSellingItems", topSellingItems);

            // Get low stock items
            List<Item> lowStockItems = itemRepository.findAll().stream()
                .filter(item -> {
                    Integer minStock = item.getMinStock();
                    return item.getQuantity() <= (minStock != null ? minStock : 5);
                })
                .limit(5)
                .toList();
            salesData.put("lowStockItems", lowStockItems);

            // Empty data for yearly sales (placeholder)
            salesData.put("yearlySales", new ArrayList<>());

            System.out.println("Sales data fetched successfully");
            return ResponseEntity.ok(salesData);
        } catch (Exception e) {
            System.out.println("Error fetching sales data: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch sales data", "message", e.getMessage()));
        }
    }

    @GetMapping("/item/{itemId}")
    public List<SalesRecord> getSalesByItemId(@PathVariable String itemId) {
        return salesRecordRepository.findByItemId(itemId);
    }

    @GetMapping("/category/{category}")
    public List<SalesRecord> getSalesByCategory(@PathVariable String category) {
        return salesRecordRepository.findByCategory(category);
    }

    @GetMapping("/period")
    public List<SalesRecord> getSalesByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return salesRecordRepository.findByTimestampBetween(start, end);
    }

    @GetMapping("/item/{itemId}/period")
    public List<SalesRecord> getItemSalesByPeriod(
            @PathVariable String itemId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return salesRecordRepository.findByItemIdAndTimestampBetween(itemId, start, end);
    }

    @GetMapping("/history/{itemId}")
    public ResponseEntity<?> getItemSalesHistory(@PathVariable String itemId) {
        try {
            System.out.println("Fetching sales history for item: " + itemId);
            List<SalesRecord> salesHistory = salesRecordRepository.findByItemIdOrderByTimestampDesc(itemId);
            System.out.println("Found " + salesHistory.size() + " sales records");
            return ResponseEntity.ok(salesHistory);
        } catch (Exception e) {
            System.err.println("Error fetching sales history: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch sales history", "message", e.getMessage()));
        }
    }
} 