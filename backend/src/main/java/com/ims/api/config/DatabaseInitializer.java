package com.ims.api.config;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.ims.api.model.Category;
import com.ims.api.model.Item;
import com.ims.api.model.User;
import com.ims.api.repository.CategoryRepository;
import com.ims.api.repository.ItemRepository;
import com.ims.api.repository.UserRepository;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private MongoTemplate mongoTemplate;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("====================================================");
        System.out.println("Starting Database Initialization");
        System.out.println("====================================================");
        
        // Create MongoDB collections if they don't exist
        if (!mongoTemplate.collectionExists("users")) {
            System.out.println("Creating users collection");
            mongoTemplate.createCollection("users");
        }
        
        if (!mongoTemplate.collectionExists("categories")) {
            System.out.println("Creating categories collection");
            mongoTemplate.createCollection("categories");
        }
        
        if (!mongoTemplate.collectionExists("items")) {
            System.out.println("Creating items collection");
            mongoTemplate.createCollection("items");
        }
        
        if (!mongoTemplate.collectionExists("salesRecords")) {
            System.out.println("Creating salesRecords collection");
            mongoTemplate.createCollection("salesRecords");
        }

        // Initialize admin user if it doesn't exist
        if (!userRepository.existsByUsername("admin")) {
            System.out.println("Creating admin user...");
            User admin = new User("admin", passwordEncoder.encode("admin123"));
            admin = userRepository.save(admin);
            System.out.println("Admin user created with ID: " + admin.getId());
        } else {
            System.out.println("Admin user already exists, skipping creation");
        }

        // Initialize categories if they don't exist
        if (categoryRepository.count() == 0) {
            System.out.println("Initializing categories...");
            initializeCategories();
        } else {
            System.out.println("Categories already exist, skipping initialization");
            System.out.println("Found " + categoryRepository.count() + " categories");
        }

        // Initialize items if they don't exist
        if (itemRepository.count() == 0) {
            System.out.println("Initializing inventory items...");
            initializeItems();
        } else {
            System.out.println("Inventory items already exist, skipping initialization");
            System.out.println("Found " + itemRepository.count() + " items");
        }
        
        System.out.println("====================================================");
        System.out.println("Database Initialization Complete");
        System.out.println("====================================================");
    }

    private void initializeCategories() {
        List<Category> categories = Arrays.asList(
            new Category("Electronics", "/assets/images/categories/electronics.jpg"),
            new Category("Furniture", "/assets/images/categories/furniture.jpg"),
            new Category("Stationery", "/assets/images/categories/default.jpg"),
            new Category("Office Supplies", "/assets/images/categories/office-supplies.jpg")
        );
        
        categoryRepository.saveAll(categories);
        System.out.println("Categories initialized: " + categories.size() + " categories created");
    }

    private void initializeItems() {
        LocalDateTime now = LocalDateTime.now();
        
        // Electronics
        Item laptop = new Item("Laptop", "Electronics", 15, 5);
        laptop.setLastUpdated(now);
        laptop.setImageUrl("/assets/images/categories/electronics.jpg");
        laptop.setSales(45);
        laptop.setPrice(45000.00); // ₹45,000
        
        Item smartphone = new Item("Smartphone", "Electronics", 7, 3);
        smartphone.setLastUpdated(now);
        smartphone.setImageUrl("/assets/images/categories/electronics.jpg");
        smartphone.setSales(23);
        smartphone.setPrice(25000.00); // ₹25,000
        
        Item wirelessMouse = new Item("Wireless Mouse", "Electronics", 21, 8);
        wirelessMouse.setLastUpdated(now);
        wirelessMouse.setImageUrl("/assets/images/categories/electronics.jpg");
        wirelessMouse.setSales(67);
        wirelessMouse.setPrice(1200.00); // ₹1,200
        
        Item ergonomicKeyboard = new Item("Ergonomic Keyboard", "Electronics", 4, 2);
        ergonomicKeyboard.setLastUpdated(now);
        ergonomicKeyboard.setImageUrl("/assets/images/categories/electronics.jpg");
        ergonomicKeyboard.setSales(12);
        ergonomicKeyboard.setPrice(2500.00); // ₹2,500
        
        // Furniture
        Item officeChair = new Item("Office Chair", "Furniture", 8, 3);
        officeChair.setLastUpdated(now);
        officeChair.setImageUrl("/assets/images/categories/furniture.jpg");
        officeChair.setSales(15);
        officeChair.setPrice(7500.00); // ₹7,500
        
        Item desk = new Item("Desk", "Furniture", 5, 2);
        desk.setLastUpdated(now);
        desk.setImageUrl("/assets/images/categories/furniture.jpg");
        desk.setSales(8);
        desk.setPrice(12000.00); // ₹12,000
        
        Item filingCabinet = new Item("Filing Cabinet", "Furniture", 12, 4);
        filingCabinet.setLastUpdated(now);
        filingCabinet.setImageUrl("/assets/images/categories/furniture.jpg");
        filingCabinet.setSales(5);
        filingCabinet.setPrice(5500.00); // ₹5,500
        
        Item bookshelf = new Item("Bookshelf", "Furniture", 6, 2);
        bookshelf.setLastUpdated(now);
        bookshelf.setImageUrl("/assets/images/categories/furniture.jpg");
        bookshelf.setSales(3);
        bookshelf.setPrice(8000.00); // ₹8,000
        
        // Stationery
        Item notebook = new Item("Notebook", "Stationery", 50, 20);
        notebook.setLastUpdated(now);
        notebook.setImageUrl("/assets/images/categories/default.jpg");
        notebook.setSales(120);
        notebook.setPrice(150.00); // ₹150
        
        Item pens = new Item("Pens (Box)", "Stationery", 30, 10);
        pens.setLastUpdated(now);
        pens.setImageUrl("/assets/images/categories/default.jpg");
        pens.setSales(89);
        pens.setPrice(120.00); // ₹120
        
        Item stickyNotes = new Item("Sticky Notes", "Stationery", 25, 10);
        stickyNotes.setLastUpdated(now);
        stickyNotes.setImageUrl("/assets/images/categories/default.jpg");
        stickyNotes.setSales(56);
        stickyNotes.setPrice(80.00); // ₹80
        
        // Office Supplies
        Item deskLamp = new Item("Desk Lamp", "Office Supplies", 10, 4);
        deskLamp.setLastUpdated(now);
        deskLamp.setImageUrl("/assets/images/categories/office-supplies.jpg");
        deskLamp.setSales(22);
        deskLamp.setPrice(850.00); // ₹850
        
        Item scissors = new Item("Scissors", "Office Supplies", 15, 5);
        scissors.setLastUpdated(now);
        scissors.setImageUrl("/assets/images/categories/office-supplies.jpg");
        scissors.setSales(33);
        scissors.setPrice(95.00); // ₹95
        
        Item staplers = new Item("Staplers", "Office Supplies", 8, 3);
        staplers.setLastUpdated(now);
        staplers.setImageUrl("/assets/images/categories/office-supplies.jpg");
        staplers.setSales(19);
        staplers.setPrice(175.00); // ₹175
        
        List<Item> items = Arrays.asList(
            laptop, smartphone, wirelessMouse, ergonomicKeyboard,
            officeChair, desk, filingCabinet, bookshelf,
            notebook, pens, stickyNotes,
            deskLamp, scissors, staplers
        );
        
        itemRepository.saveAll(items);
        System.out.println("Items initialized: " + items.size() + " items created");
    }
} 