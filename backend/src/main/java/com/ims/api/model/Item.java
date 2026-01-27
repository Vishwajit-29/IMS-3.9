package com.ims.api.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "items")
public class Item {
    
    @Id
    private String id;
    
    private String name;
    
    private String category;
    
    private String description;
    
    private int quantity;
    
    private int minStock;
    
    private int sales;
    
    private LocalDateTime lastUpdated;
    
    private String imageUrl;
    
    private double price;
    
    public Item() {
        this.lastUpdated = LocalDateTime.now();
        this.sales = 0;
        this.price = 0.0;
    }
    
    public Item(String name, String category, int quantity) {
        this.name = name;
        this.category = category;
        this.quantity = quantity;
        this.minStock = 0;
        this.sales = 0;
        this.lastUpdated = LocalDateTime.now();
        this.price = 0.0;
    }

    public Item(String name, String category, int quantity, int minStock) {
        this.name = name;
        this.category = category;
        this.quantity = quantity;
        this.minStock = minStock;
        this.sales = 0;
        this.lastUpdated = LocalDateTime.now();
        this.price = 0.0;
    }

    public Item(String name, String category, int quantity, int minStock, double price) {
        this.name = name;
        this.category = category;
        this.quantity = quantity;
        this.minStock = minStock;
        this.sales = 0;
        this.lastUpdated = LocalDateTime.now();
        this.price = price;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
        this.lastUpdated = LocalDateTime.now();
    }

    public int getMinStock() {
        return minStock;
    }

    public void setMinStock(int minStock) {
        this.minStock = minStock;
    }

    public int getSales() {
        return sales;
    }

    public void setSales(int sales) {
        this.sales = sales;
    }
    
    public void incrementSales(int amount) {
        this.sales += amount;
        this.lastUpdated = LocalDateTime.now();
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
    
    public double getPrice() {
        return price;
    }
    
    public void setPrice(double price) {
        this.price = price;
    }
    
    public boolean isInStock() {
        return quantity > 0;
    }
    
    public boolean isLowStock() {
        return quantity <= minStock;
    }

    @Override
    public String toString() {
        return "Item [id=" + id + ", name=" + name + ", category=" + category + ", quantity=" + quantity + 
                ", minStock=" + minStock + ", sales=" + sales + ", price=" + price + "]";
    }
} 