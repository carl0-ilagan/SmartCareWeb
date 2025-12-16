-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 15, 2025 at 08:21 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `crownsysfinal`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendance_schedules`
--

CREATE TABLE `attendance_schedules` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `start_time` varchar(255) NOT NULL,
  `end_time` varchar(255) NOT NULL,
  `shift_type` enum('morning','afternoon','evening','night') NOT NULL,
  `status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
  `time_in` time DEFAULT NULL,
  `time_out` time DEFAULT NULL,
  `attendance_status` enum('present','absent','late') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking`
--

CREATE TABLE `booking` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `client_id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `roomNumber` varchar(255) NOT NULL,
  `roomType` varchar(255) NOT NULL,
  `check_in_date` date NOT NULL,
  `check_out_date` date NOT NULL,
  `adults` int(11) NOT NULL DEFAULT 1,
  `children` int(11) NOT NULL DEFAULT 0,
  `extra_beds` int(11) NOT NULL DEFAULT 0,
  `extra_bed_rate` decimal(10,2) NOT NULL DEFAULT 500.00,
  `amount` decimal(10,2) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','confirmed','checked_in','checked_out','cancelled') NOT NULL DEFAULT 'pending',
  `special_requests` text DEFAULT NULL,
  `booking_reference` varchar(255) DEFAULT NULL,
  `payment_method` varchar(255) NOT NULL,
  `payment_status` enum('pending','paid','partially_paid','cancelled') NOT NULL DEFAULT 'pending',
  `valid_id` varchar(255) NOT NULL,
  `payment_transaction_id` varchar(255) DEFAULT NULL,
  `terms_accepted` tinyint(1) NOT NULL DEFAULT 0,
  `payment_proof` varchar(255) DEFAULT NULL,
  `payment_link_id` varchar(255) DEFAULT NULL,
  `payment_link_url` text DEFAULT NULL,
  `paymongo_payment_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `booking`
--

INSERT INTO `booking` (`id`, `client_id`, `email`, `roomNumber`, `roomType`, `check_in_date`, `check_out_date`, `adults`, `children`, `extra_beds`, `extra_bed_rate`, `amount`, `total_amount`, `status`, `special_requests`, `booking_reference`, `payment_method`, `payment_status`, `valid_id`, `payment_transaction_id`, `terms_accepted`, `payment_proof`, `payment_link_id`, `payment_link_url`, `paymongo_payment_id`, `created_at`, `updated_at`) VALUES
(1, 2, 'ilagancarl19@gmail.com', '203', 'deluxe', '2025-12-17', '2025-12-18', 1, 0, 0, 500.00, 3500.00, 3500.00, 'confirmed', '', 'BK-1765817221862-4855', 'gcash', 'paid', 'Bookings/2025/12/valid_id_1765817222_69403b867e553.png', NULL, 1, NULL, '', 'https://pm.link/org-VH3pTznUnp7NGW5T9YBy5Wro/test/A92XhXA', 'pay_test_1765818003', '2025-12-15 08:47:02', '2025-12-15 09:00:03'),
(2, 2, 'ilagancarl19@gmail.com', '101', 'standard', '2025-12-20', '2025-12-21', 1, 0, 0, 500.00, 2500.00, 2500.00, 'confirmed', '', 'BK-1765818091892-4154', 'gcash', 'paid', 'Bookings/2025/12/valid_id_1765818092_69403eec67f36.png', NULL, 1, NULL, 'link_WeNA4rVm1L1zmY3nqpYKzb26', 'https://pm.link/org-VH3pTznUnp7NGW5T9YBy5Wro/test/rik1AdF', 'pay_u3YGPbjp3yJempKxTZ3dNLxh', '2025-12-15 09:01:32', '2025-12-15 09:11:51'),
(3, 2, 'quenniedayo@gmail.com', '102', 'standard', '2025-12-29', '2025-12-31', 1, 0, 0, 500.00, 2500.00, 5000.00, 'pending', '', 'BK-1765822206833-9211', 'pending', 'pending', 'Bookings/2025/12/valid_id_1765822207_69404eff844e5.jpg', NULL, 1, NULL, 'link_VQG5oaVN5bB7skpRtCbfLBH9', 'https://pm.link/org-VH3pTznUnp7NGW5T9YBy5Wro/test/H3Jq6n6', NULL, '2025-12-15 10:10:07', '2025-12-15 10:10:08');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `client_name` varchar(255) NOT NULL,
  `event_type` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `start_time` varchar(255) NOT NULL,
  `end_time` varchar(255) NOT NULL,
  `venue` varchar(255) NOT NULL,
  `guest_count` int(11) NOT NULL,
  `status` enum('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
  `contact_number` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `special_requests` text DEFAULT NULL,
  `package_type` varchar(255) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `deposit_amount` decimal(10,2) NOT NULL,
  `deposit_paid` tinyint(1) NOT NULL DEFAULT 0,
  `fully_paid` tinyint(1) NOT NULL DEFAULT 0,
  `payment_status` enum('unpaid','deposit_paid','fully_paid') NOT NULL DEFAULT 'unpaid',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`id`, `client_name`, `event_type`, `date`, `start_time`, `end_time`, `venue`, `guest_count`, `status`, `contact_number`, `email`, `special_requests`, `package_type`, `total_amount`, `deposit_amount`, `deposit_paid`, `fully_paid`, `payment_status`, `created_at`, `updated_at`) VALUES
(1, 'Maria Santos & Juan dela Cruz', 'wedding', '2026-01-29', '14:00', '22:00', 'Grand Ballroom', 200, 'confirmed', '09171234567', 'maria.santos@email.com', 'Need wedding arch and floral decorations. Vegetarian menu options required.', 'Premium Wedding Package', 250000.00, 125000.00, 1, 0, 'deposit_paid', '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(2, 'Anna Reyes & Mark Torres', 'wedding', '2026-03-15', '16:00', '23:00', 'Garden Pavilion', 150, 'pending', '09189876543', 'anna.reyes@email.com', 'Outdoor setup with garden lights. Live band performance.', 'Garden Wedding Package', 180000.00, 90000.00, 0, 0, 'unpaid', '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(3, 'Sofia Cruz & Michael Tan', 'wedding', '2025-11-15', '15:00', '22:00', 'Seaside Hall', 180, 'completed', '09165554321', 'sofia.cruz@email.com', 'Beach-themed decorations. Photo booth setup.', 'Deluxe Wedding Package', 220000.00, 110000.00, 1, 1, 'fully_paid', '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(4, 'ABC Corporation', 'corporate', '2025-12-30', '09:00', '17:00', 'Conference Hall A', 100, 'confirmed', '09171112222', 'events@abccorp.com', 'Need projector, sound system, and high-speed WiFi. Coffee breaks at 10am and 3pm.', 'Full Day Corporate Package', 85000.00, 42500.00, 1, 0, 'deposit_paid', '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(5, 'Tech Solutions Inc.', 'corporate', '2026-02-13', '13:00', '18:00', 'Executive Lounge', 50, 'confirmed', '09189998888', 'hr@techsolutions.com', 'Team building activities. Cocktail reception after meeting.', 'Half Day Corporate Package', 55000.00, 27500.00, 1, 1, 'fully_paid', '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(6, 'Isabella Fernandez', 'birthday', '2026-01-04', '18:00', '23:00', 'Party Room B', 80, 'confirmed', '09175556677', 'isabella.fernandez@email.com', '18th birthday debut. Need stage for program and dance floor.', 'Debut Package', 120000.00, 60000.00, 1, 0, 'deposit_paid', '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(7, 'Roberto Garcia', 'birthday', '2026-01-19', '14:00', '18:00', 'Kids Party Area', 40, 'pending', '09163334455', 'roberto.garcia@email.com', 'Kids birthday party. Need clown, magic show, and bouncy castle.', 'Kids Party Package', 45000.00, 22500.00, 0, 0, 'unpaid', '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(8, 'Gloria Mendoza', 'birthday', '2026-01-09', '19:00', '01:00', 'Grand Ballroom', 150, 'confirmed', '09182223344', 'gloria.mendoza@email.com', '50th birthday celebration. DJ and karaoke setup required.', 'Golden Birthday Package', 95000.00, 47500.00, 1, 0, 'deposit_paid', '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(9, 'Philippine Medical Association', 'conference', '2026-02-28', '08:00', '18:00', 'Conference Hall A & B', 250, 'confirmed', '09176667788', 'events@pma.org.ph', 'Medical conference. Need multiple breakout rooms, AV equipment, and lunch buffet.', 'Conference Package', 185000.00, 92500.00, 1, 0, 'deposit_paid', '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(10, 'Education Summit 2026', 'conference', '2026-04-14', '07:30', '17:00', 'Grand Convention Center', 300, 'pending', '09199990000', 'contact@educsummit.com', 'Three-day conference. Need accommodation packages and all meals.', 'Multi-Day Conference Package', 450000.00, 225000.00, 0, 0, 'unpaid', '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(11, 'Hope Foundation', 'charity', '2026-02-03', '18:00', '22:00', 'Grand Ballroom', 180, 'confirmed', '09155558888', 'events@hopefoundation.org', 'Charity gala dinner. Need stage for awards ceremony and auction area.', 'Charity Gala Package', 135000.00, 67500.00, 1, 0, 'deposit_paid', '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(12, 'Class of 2005 Reunion', 'social', '2026-01-24', '17:00', '23:00', 'Garden Pavilion', 120, 'pending', '09167778899', 'reunion2005@email.com', 'High school reunion. Need photo wall and memory lane setup.', 'Reunion Package', 75000.00, 37500.00, 0, 0, 'unpaid', '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(13, 'Martinez Family', 'social', '2025-12-25', '12:00', '18:00', 'Private Function Room', 60, 'confirmed', '09188889999', 'martinez.family@email.com', 'Family reunion and luncheon. Kid-friendly menu needed.', 'Family Gathering Package', 48000.00, 24000.00, 1, 1, 'fully_paid', '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(14, 'ProductX Launch', 'other', '2026-01-14', '19:00', '23:00', 'Executive Lounge', 90, 'confirmed', '09174445566', 'launch@productx.com', 'Product launch event. Need display area, stage lighting, and cocktail setup.', 'Product Launch Package', 98000.00, 49000.00, 1, 0, 'deposit_paid', '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(15, 'Sarah Johnson', 'birthday', '2026-02-08', '18:00', '22:00', 'Party Room A', 70, 'cancelled', '09151112233', 'sarah.johnson@email.com', 'Cancelled due to personal reasons.', 'Standard Birthday Package', 55000.00, 27500.00, 0, 0, 'unpaid', '2025-12-15 07:37:48', '2025-12-15 07:37:48');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `feedbacks`
--

CREATE TABLE `feedbacks` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `feedback_type` varchar(255) DEFAULT NULL,
  `employee_name` varchar(255) DEFAULT NULL,
  `employee_id` bigint(20) UNSIGNED DEFAULT NULL,
  `service_type` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL,
  `comment` text NOT NULL,
  `sentiment` varchar(255) DEFAULT NULL,
  `sentiment_score` double DEFAULT NULL,
  `anonymous` tinyint(1) NOT NULL DEFAULT 0,
  `status` varchar(255) NOT NULL DEFAULT 'published',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventories`
--

CREATE TABLE `inventories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `itemName` varchar(255) NOT NULL,
  `itemCode` varchar(255) NOT NULL,
  `category` enum('food','housekeeping','equipment','amenities','maintenance','office') NOT NULL,
  `quantity` float NOT NULL DEFAULT 0,
  `unit` varchar(255) NOT NULL DEFAULT 'pcs',
  `minStockLevel` float NOT NULL DEFAULT 0,
  `price` decimal(10,2) NOT NULL,
  `supplier` varchar(255) DEFAULT NULL,
  `location` enum('kitchen','restaurant','bar','storage','housekeeping','maintenance','office') NOT NULL DEFAULT 'storage',
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `lastRestocked` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventories`
--

INSERT INTO `inventories` (`id`, `itemName`, `itemCode`, `category`, `quantity`, `unit`, `minStockLevel`, `price`, `supplier`, `location`, `description`, `image`, `lastRestocked`, `created_at`, `updated_at`) VALUES
(1, 'Rice - Premium Jasmine', 'FOOD-001', 'food', 150, 'kg', 50, 65.00, 'Metro Food Supplies', 'kitchen', 'Premium quality jasmine rice for restaurant use', NULL, '2025-12-10 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(2, 'Chicken Breast - Fresh', 'FOOD-002', 'food', 45, 'kg', 20, 280.00, 'Fresh Meat Distributors', 'kitchen', 'Fresh chicken breast, Grade A quality', NULL, '2025-12-14 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(3, 'Beef Tenderloin', 'FOOD-003', 'food', 25, 'kg', 10, 850.00, 'Premium Meats Inc', 'kitchen', 'Premium beef tenderloin for steaks', NULL, '2025-12-13 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(4, 'Salmon Fillet', 'FOOD-004', 'food', 18, 'kg', 8, 950.00, 'Ocean Fresh Seafood', 'kitchen', 'Fresh Atlantic salmon fillet', NULL, '2025-12-14 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(5, 'Fresh Vegetables Mix', 'FOOD-005', 'food', 35, 'kg', 15, 120.00, 'Green Valley Farms', 'kitchen', 'Assorted fresh vegetables for daily use', NULL, '2025-12-14 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(6, 'Pasta - Spaghetti', 'FOOD-006', 'food', 80, 'kg', 30, 180.00, 'Italian Food Imports', 'kitchen', 'Premium Italian spaghetti pasta', NULL, '2025-12-05 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(7, 'Olive Oil - Extra Virgin', 'FOOD-007', 'food', 25, 'liter', 10, 450.00, 'Mediterranean Imports', 'kitchen', 'Premium extra virgin olive oil', NULL, '2025-11-30 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(8, 'Coffee Beans - Arabica', 'FOOD-008', 'food', 40, 'kg', 15, 650.00, 'Barista Coffee Supply', 'bar', 'Premium Arabica coffee beans', NULL, '2025-12-08 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(9, 'Red Wine - Cabernet Sauvignon', 'FOOD-009', 'food', 48, 'bottle', 20, 1200.00, 'Wine Cellars International', 'bar', 'Premium red wine from France', NULL, '2025-12-03 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(10, 'Whiskey - Jack Daniels', 'FOOD-010', 'food', 24, 'bottle', 12, 1850.00, 'Premium Spirits Distributor', 'bar', 'Jack Daniels Tennessee Whiskey 750ml', NULL, '2025-12-07 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(11, 'Soft Drinks - Assorted', 'FOOD-011', 'food', 200, 'can', 100, 25.00, 'Beverage Distributors Corp', 'bar', 'Assorted soft drinks in cans', NULL, '2025-12-12 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(12, 'Bed Sheets - Queen Size White', 'HOUSE-001', 'housekeeping', 150, 'pcs', 80, 450.00, 'Hotel Linens Supply', 'housekeeping', 'Premium white queen size bed sheets, 300 thread count', NULL, '2025-11-25 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(13, 'Bath Towels - Large', 'HOUSE-002', 'housekeeping', 200, 'pcs', 100, 180.00, 'Hotel Linens Supply', 'housekeeping', 'Large white bath towels, 100% cotton', NULL, '2025-11-30 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(14, 'Hand Towels', 'HOUSE-003', 'housekeeping', 180, 'pcs', 100, 85.00, 'Hotel Linens Supply', 'housekeeping', 'White hand towels, 100% cotton', NULL, '2025-11-30 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(15, 'Pillows - Standard', 'HOUSE-004', 'housekeeping', 100, 'pcs', 50, 320.00, 'Comfort Sleep Products', 'storage', 'Standard size hotel pillows with microfiber filling', NULL, '2025-11-15 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(16, 'Laundry Detergent', 'HOUSE-005', 'housekeeping', 45, 'liter', 20, 280.00, 'Professional Cleaning Supplies', 'housekeeping', 'Industrial strength laundry detergent', NULL, '2025-12-05 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(17, 'Fabric Softener', 'HOUSE-006', 'housekeeping', 30, 'liter', 15, 220.00, 'Professional Cleaning Supplies', 'housekeeping', 'Premium fabric softener for linens', NULL, '2025-12-05 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(18, 'All-Purpose Cleaner', 'HOUSE-007', 'housekeeping', 50, 'liter', 25, 150.00, 'Professional Cleaning Supplies', 'housekeeping', 'Multi-surface cleaning solution', NULL, '2025-12-07 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(19, 'Glass Cleaner', 'HOUSE-008', 'housekeeping', 35, 'liter', 15, 120.00, 'Professional Cleaning Supplies', 'housekeeping', 'Streak-free glass and mirror cleaner', NULL, '2025-12-07 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(20, 'Shampoo - Individual Bottles', 'AMEN-001', 'amenities', 500, 'pcs', 200, 18.00, 'Hotel Amenities Supplier', 'storage', '30ml shampoo bottles for guest rooms', NULL, '2025-12-01 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(21, 'Conditioner - Individual Bottles', 'AMEN-002', 'amenities', 500, 'pcs', 200, 18.00, 'Hotel Amenities Supplier', 'storage', '30ml conditioner bottles for guest rooms', NULL, '2025-12-01 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(22, 'Body Soap - Individual Bars', 'AMEN-003', 'amenities', 600, 'pcs', 250, 12.00, 'Hotel Amenities Supplier', 'storage', 'Individual soap bars for guest rooms', NULL, '2025-12-01 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(23, 'Dental Kit', 'AMEN-004', 'amenities', 400, 'set', 150, 15.00, 'Hotel Amenities Supplier', 'storage', 'Toothbrush and toothpaste kit', NULL, '2025-12-01 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(24, 'Slippers - Disposable', 'AMEN-005', 'amenities', 350, 'pair', 150, 22.00, 'Hotel Amenities Supplier', 'storage', 'Disposable guest slippers', NULL, '2025-12-01 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(25, 'Vacuum Cleaner - Industrial', 'EQUIP-001', 'equipment', 8, 'unit', 6, 15500.00, 'Hotel Equipment Supply', 'housekeeping', 'Heavy-duty vacuum cleaner for hotel use', NULL, '2025-09-16 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(26, 'Floor Polisher', 'EQUIP-002', 'equipment', 4, 'unit', 3, 22000.00, 'Hotel Equipment Supply', 'maintenance', 'Professional floor polishing machine', NULL, '2025-08-17 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(27, 'Housekeeping Cart', 'EQUIP-003', 'equipment', 12, 'unit', 10, 8500.00, 'Hotel Equipment Supply', 'housekeeping', 'Wheeled housekeeping cart with compartments', NULL, '2025-10-16 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(28, 'Light Bulbs - LED 15W', 'MAINT-001', 'maintenance', 150, 'pcs', 50, 95.00, 'Electrical Supplies Inc', 'maintenance', 'LED light bulbs for room lighting', NULL, '2025-11-20 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(29, 'Air Filter - HVAC', 'MAINT-002', 'maintenance', 40, 'pcs', 20, 280.00, 'HVAC Parts Supplier', 'maintenance', 'Replacement air filters for HVAC systems', NULL, '2025-11-15 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(30, 'Paint - Interior White', 'MAINT-003', 'maintenance', 25, 'liter', 10, 320.00, 'Building Materials Supply', 'maintenance', 'Interior white paint for touch-ups', NULL, '2025-10-31 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(31, 'Plumbing Fixtures - Assorted', 'MAINT-004', 'maintenance', 50, 'pcs', 20, 180.00, 'Plumbing Supplies Corp', 'maintenance', 'Assorted plumbing fixtures and fittings', NULL, '2025-11-25 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(32, 'Printer Paper - A4', 'OFFICE-001', 'office', 50, 'ream', 20, 220.00, 'Office Depot', 'office', 'A4 size printer paper, 500 sheets per ream', NULL, '2025-11-27 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(33, 'Ballpoint Pens - Black', 'OFFICE-002', 'office', 200, 'pcs', 100, 12.00, 'Office Depot', 'office', 'Black ballpoint pens', NULL, '2025-11-23 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35'),
(34, 'Folders - Manila', 'OFFICE-003', 'office', 100, 'pcs', 50, 8.00, 'Office Depot', 'office', 'Manila folders for document storage', NULL, '2025-11-17 07:37:35', '2025-12-15 07:37:35', '2025-12-15 07:37:35');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_logs`
--

CREATE TABLE `inventory_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `inventory_id` bigint(20) UNSIGNED NOT NULL,
  `log_type` enum('restock','usage','adjustment','transfer','initial') NOT NULL,
  `quantity_change` decimal(10,2) NOT NULL,
  `quantity_before` decimal(10,2) NOT NULL,
  `quantity_after` decimal(10,2) NOT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `total_expense` decimal(10,2) DEFAULT NULL,
  `performed_by` bigint(20) UNSIGNED NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `invoiceable_type` varchar(255) NOT NULL,
  `invoiceable_id` bigint(20) UNSIGNED NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `customer_address` text DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL DEFAULT 0.00,
  `balance_due` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_status` varchar(50) NOT NULL DEFAULT 'pending',
  `payment_date` datetime DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'draft',
  `notes` text DEFAULT NULL,
  `terms_conditions` text DEFAULT NULL,
  `issued_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `cancelled_by` bigint(20) UNSIGNED DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `issued_at` datetime DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `invoiceable_type`, `invoiceable_id`, `invoice_number`, `invoice_date`, `due_date`, `customer_name`, `customer_email`, `customer_phone`, `customer_address`, `subtotal`, `tax_amount`, `discount_amount`, `total_amount`, `amount_paid`, `balance_due`, `payment_method`, `payment_status`, `payment_date`, `payment_reference`, `status`, `notes`, `terms_conditions`, `issued_by`, `approved_by`, `cancelled_by`, `cancellation_reason`, `issued_at`, `paid_at`, `cancelled_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\Event', 1, 'INV-20251215-001', '2025-12-15', '2026-01-29', 'Maria Santos & Juan dela Cruz', 'maria.santos@email.com', '09171234567', NULL, 250000.00, 0.00, 0.00, 250000.00, 125000.00, 125000.00, NULL, 'partial', NULL, NULL, 'issued', 'Final invoice for wedding event', NULL, NULL, NULL, NULL, NULL, '2025-12-15 15:37:48', NULL, NULL, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(2, 'App\\Models\\Event', 1, 'INV-20251215-002', '2025-12-15', '2026-01-29', 'Maria Santos & Juan dela Cruz', 'maria.santos@email.com', '09171234567', NULL, 125000.00, 0.00, 0.00, 125000.00, 125000.00, 0.00, NULL, 'paid', NULL, NULL, 'issued', 'Deposit invoice for wedding event', NULL, NULL, NULL, NULL, NULL, '2025-12-15 15:37:48', NULL, NULL, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(3, 'App\\Models\\Event', 3, 'INV-20251215-003', '2025-12-15', '2025-11-15', 'Sofia Cruz & Michael Tan', 'sofia.cruz@email.com', '09165554321', NULL, 110000.00, 0.00, 0.00, 110000.00, 110000.00, 0.00, NULL, 'paid', NULL, NULL, 'issued', 'Deposit invoice for wedding event', NULL, NULL, NULL, NULL, NULL, '2025-12-15 15:37:48', NULL, NULL, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(4, 'App\\Models\\Event', 4, 'INV-20251215-004', '2025-12-15', '2025-12-30', 'ABC Corporation', 'events@abccorp.com', '09171112222', NULL, 85000.00, 0.00, 0.00, 85000.00, 42500.00, 42500.00, NULL, 'partial', NULL, NULL, 'issued', 'Final invoice for corporate event', NULL, NULL, NULL, NULL, NULL, '2025-12-15 15:37:48', NULL, NULL, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(5, 'App\\Models\\Event', 4, 'INV-20251215-005', '2025-12-15', '2025-12-30', 'ABC Corporation', 'events@abccorp.com', '09171112222', NULL, 42500.00, 0.00, 0.00, 42500.00, 42500.00, 0.00, NULL, 'paid', NULL, NULL, 'issued', 'Deposit invoice for corporate event', NULL, NULL, NULL, NULL, NULL, '2025-12-15 15:37:48', NULL, NULL, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(6, 'App\\Models\\Event', 5, 'INV-20251215-006', '2025-12-15', '2026-02-13', 'Tech Solutions Inc.', 'hr@techsolutions.com', '09189998888', NULL, 55000.00, 0.00, 0.00, 55000.00, 55000.00, 0.00, NULL, 'paid', NULL, NULL, 'issued', 'Final invoice for corporate event', NULL, NULL, NULL, NULL, NULL, '2025-12-15 15:37:48', NULL, NULL, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(7, 'App\\Models\\Event', 5, 'INV-20251215-007', '2025-12-15', '2026-02-13', 'Tech Solutions Inc.', 'hr@techsolutions.com', '09189998888', NULL, 27500.00, 0.00, 0.00, 27500.00, 27500.00, 0.00, NULL, 'paid', NULL, NULL, 'issued', 'Deposit invoice for corporate event', NULL, NULL, NULL, NULL, NULL, '2025-12-15 15:37:48', NULL, NULL, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(8, 'App\\Models\\Event', 6, 'INV-20251215-008', '2025-12-15', '2026-01-04', 'Isabella Fernandez', 'isabella.fernandez@email.com', '09175556677', NULL, 120000.00, 0.00, 0.00, 120000.00, 60000.00, 60000.00, NULL, 'partial', NULL, NULL, 'issued', 'Final invoice for birthday event', NULL, NULL, NULL, NULL, NULL, '2025-12-15 15:37:48', NULL, NULL, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(9, 'App\\Models\\Event', 6, 'INV-20251215-009', '2025-12-15', '2026-01-04', 'Isabella Fernandez', 'isabella.fernandez@email.com', '09175556677', NULL, 60000.00, 0.00, 0.00, 60000.00, 60000.00, 0.00, NULL, 'paid', NULL, NULL, 'issued', 'Deposit invoice for birthday event', NULL, NULL, NULL, NULL, NULL, '2025-12-15 15:37:48', NULL, NULL, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(10, 'App\\Models\\Event', 8, 'INV-20251215-010', '2025-12-15', '2026-01-09', 'Gloria Mendoza', 'gloria.mendoza@email.com', '09182223344', NULL, 95000.00, 0.00, 0.00, 95000.00, 47500.00, 47500.00, NULL, 'partial', NULL, NULL, 'issued', 'Final invoice for birthday event', NULL, NULL, NULL, NULL, NULL, '2025-12-15 15:37:48', NULL, NULL, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(11, 'App\\Models\\Event', 8, 'INV-20251215-011', '2025-12-15', '2026-01-09', 'Gloria Mendoza', 'gloria.mendoza@email.com', '09182223344', NULL, 47500.00, 0.00, 0.00, 47500.00, 47500.00, 0.00, NULL, 'paid', NULL, NULL, 'issued', 'Deposit invoice for birthday event', NULL, NULL, NULL, NULL, NULL, '2025-12-15 15:37:48', NULL, NULL, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(12, 'App\\Models\\Event', 9, 'INV-20251215-012', '2025-12-15', '2026-02-28', 'Philippine Medical Association', 'events@pma.org.ph', '09176667788', NULL, 185000.00, 0.00, 0.00, 185000.00, 92500.00, 92500.00, NULL, 'partial', NULL, NULL, 'issued', 'Final invoice for conference event', NULL, NULL, NULL, NULL, NULL, '2025-12-15 15:37:48', NULL, NULL, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(13, 'App\\Models\\Event', 9, 'INV-20251215-013', '2025-12-15', '2026-02-28', 'Philippine Medical Association', 'events@pma.org.ph', '09176667788', NULL, 92500.00, 0.00, 0.00, 92500.00, 92500.00, 0.00, NULL, 'paid', NULL, NULL, 'issued', 'Deposit invoice for conference event', NULL, NULL, NULL, NULL, NULL, '2025-12-15 15:37:48', NULL, NULL, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(14, 'App\\Models\\Event', 11, 'INV-20251215-014', '2025-12-15', '2026-02-03', 'Hope Foundation', 'events@hopefoundation.org', '09155558888', NULL, 135000.00, 0.00, 0.00, 135000.00, 67500.00, 67500.00, NULL, 'partial', NULL, NULL, 'issued', 'Final invoice for charity event', NULL, NULL, NULL, NULL, NULL, '2025-12-15 15:37:48', NULL, NULL, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(15, 'App\\Models\\Event', 11, 'INV-20251215-015', '2025-12-15', '2026-02-03', 'Hope Foundation', 'events@hopefoundation.org', '09155558888', NULL, 67500.00, 0.00, 0.00, 67500.00, 67500.00, 0.00, NULL, 'paid', NULL, NULL, 'issued', 'Deposit invoice for charity event', NULL, NULL, NULL, NULL, NULL, '2025-12-15 15:37:48', NULL, NULL, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(16, 'App\\Models\\Event', 13, 'INV-20251215-016', '2025-12-15', '2025-12-25', 'Martinez Family', 'martinez.family@email.com', '09188889999', NULL, 48000.00, 0.00, 0.00, 48000.00, 48000.00, 0.00, NULL, 'paid', NULL, NULL, 'issued', 'Final invoice for social event', NULL, NULL, NULL, NULL, NULL, '2025-12-15 15:37:48', NULL, NULL, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(17, 'App\\Models\\Event', 13, 'INV-20251215-017', '2025-12-15', '2025-12-25', 'Martinez Family', 'martinez.family@email.com', '09188889999', NULL, 24000.00, 0.00, 0.00, 24000.00, 24000.00, 0.00, NULL, 'paid', NULL, NULL, 'issued', 'Deposit invoice for social event', NULL, NULL, NULL, NULL, NULL, '2025-12-15 15:37:48', NULL, NULL, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(18, 'App\\Models\\Event', 14, 'INV-20251215-018', '2025-12-15', '2026-01-14', 'ProductX Launch', 'launch@productx.com', '09174445566', NULL, 98000.00, 0.00, 0.00, 98000.00, 49000.00, 49000.00, NULL, 'partial', NULL, NULL, 'issued', 'Final invoice for other event', NULL, NULL, NULL, NULL, NULL, '2025-12-15 15:37:48', NULL, NULL, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(19, 'App\\Models\\Event', 14, 'INV-20251215-019', '2025-12-15', '2026-01-14', 'ProductX Launch', 'launch@productx.com', '09174445566', NULL, 49000.00, 0.00, 0.00, 49000.00, 49000.00, 0.00, NULL, 'paid', NULL, NULL, 'issued', 'Deposit invoice for other event', NULL, NULL, NULL, NULL, NULL, '2025-12-15 15:37:48', NULL, NULL, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(20, 'App\\Models\\Booking', 2, 'INV-20251215-020', '2025-12-15', '2025-12-20', 'Client User', 'ilagancarl19@gmail.com', NULL, NULL, 2500.00, 0.00, 0.00, 2500.00, 2500.00, 0.00, 'cash', 'paid', NULL, NULL, 'issued', '', NULL, NULL, NULL, NULL, NULL, '2025-12-15 17:11:51', NULL, NULL, '2025-12-15 09:11:51', '2025-12-15 09:11:51');

-- --------------------------------------------------------

--
-- Table structure for table `invoice_items`
--

CREATE TABLE `invoice_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `invoice_id` bigint(20) UNSIGNED NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `item_description` text DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `tax_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invoice_items`
--

INSERT INTO `invoice_items` (`id`, `invoice_id`, `item_name`, `item_description`, `quantity`, `unit_price`, `total_price`, `tax_rate`, `tax_amount`, `created_at`, `updated_at`) VALUES
(1, 1, 'Event Package - wedding', 'Premium Wedding Package package at Grand Ballroom for 200 guests on Jan 29, 2026', 1, 250000.00, 250000.00, 0.00, 0.00, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(2, 2, 'Event Deposit - wedding', 'Premium Wedding Package package at Grand Ballroom for 200 guests on Jan 29, 2026', 1, 125000.00, 125000.00, 0.00, 0.00, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(3, 3, 'Event Deposit - wedding', 'Deluxe Wedding Package package at Seaside Hall for 180 guests on Nov 15, 2025', 1, 110000.00, 110000.00, 0.00, 0.00, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(4, 4, 'Event Package - corporate', 'Full Day Corporate Package package at Conference Hall A for 100 guests on Dec 30, 2025', 1, 85000.00, 85000.00, 0.00, 0.00, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(5, 5, 'Event Deposit - corporate', 'Full Day Corporate Package package at Conference Hall A for 100 guests on Dec 30, 2025', 1, 42500.00, 42500.00, 0.00, 0.00, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(6, 6, 'Event Package - corporate', 'Half Day Corporate Package package at Executive Lounge for 50 guests on Feb 13, 2026', 1, 55000.00, 55000.00, 0.00, 0.00, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(7, 7, 'Event Deposit - corporate', 'Half Day Corporate Package package at Executive Lounge for 50 guests on Feb 13, 2026', 1, 27500.00, 27500.00, 0.00, 0.00, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(8, 8, 'Event Package - birthday', 'Debut Package package at Party Room B for 80 guests on Jan 04, 2026', 1, 120000.00, 120000.00, 0.00, 0.00, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(9, 9, 'Event Deposit - birthday', 'Debut Package package at Party Room B for 80 guests on Jan 04, 2026', 1, 60000.00, 60000.00, 0.00, 0.00, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(10, 10, 'Event Package - birthday', 'Golden Birthday Package package at Grand Ballroom for 150 guests on Jan 09, 2026', 1, 95000.00, 95000.00, 0.00, 0.00, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(11, 11, 'Event Deposit - birthday', 'Golden Birthday Package package at Grand Ballroom for 150 guests on Jan 09, 2026', 1, 47500.00, 47500.00, 0.00, 0.00, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(12, 12, 'Event Package - conference', 'Conference Package package at Conference Hall A & B for 250 guests on Feb 28, 2026', 1, 185000.00, 185000.00, 0.00, 0.00, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(13, 13, 'Event Deposit - conference', 'Conference Package package at Conference Hall A & B for 250 guests on Feb 28, 2026', 1, 92500.00, 92500.00, 0.00, 0.00, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(14, 14, 'Event Package - charity', 'Charity Gala Package package at Grand Ballroom for 180 guests on Feb 03, 2026', 1, 135000.00, 135000.00, 0.00, 0.00, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(15, 15, 'Event Deposit - charity', 'Charity Gala Package package at Grand Ballroom for 180 guests on Feb 03, 2026', 1, 67500.00, 67500.00, 0.00, 0.00, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(16, 16, 'Event Package - social', 'Family Gathering Package package at Private Function Room for 60 guests on Dec 25, 2025', 1, 48000.00, 48000.00, 0.00, 0.00, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(17, 17, 'Event Deposit - social', 'Family Gathering Package package at Private Function Room for 60 guests on Dec 25, 2025', 1, 24000.00, 24000.00, 0.00, 0.00, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(18, 18, 'Event Package - other', 'Product Launch Package package at Executive Lounge for 90 guests on Jan 14, 2026', 1, 98000.00, 98000.00, 0.00, 0.00, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(19, 19, 'Event Deposit - other', 'Product Launch Package package at Executive Lounge for 90 guests on Jan 14, 2026', 1, 49000.00, 49000.00, 0.00, 0.00, '2025-12-15 07:37:48', '2025-12-15 07:37:48'),
(20, 20, 'Room 101 - standard', 'Accommodation from Dec 20, 2025 to Dec 21, 2025', 1, 2500.00, 2500.00, 0.00, 0.00, '2025-12-15 09:11:51', '2025-12-15 09:11:51');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `menu`
--

CREATE TABLE `menu` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `menuname` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `category` varchar(255) NOT NULL,
  `preperationtime` int(11) NOT NULL,
  `description` text NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'available',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `menu`
--

INSERT INTO `menu` (`id`, `menuname`, `price`, `category`, `preperationtime`, `description`, `image`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Espresso', 85.00, 'coffee', 5, 'Rich and bold espresso shot made from premium coffee beans', NULL, 'available', '2025-12-15 07:37:15', '2025-12-15 07:37:15'),
(2, 'Cappuccino', 120.00, 'coffee', 7, 'Classic Italian coffee with steamed milk and foam', NULL, 'available', '2025-12-15 07:37:15', '2025-12-15 07:37:15'),
(3, 'Caffe Latte', 130.00, 'coffee', 7, 'Smooth espresso with velvety steamed milk', NULL, 'available', '2025-12-15 07:37:15', '2025-12-15 07:37:15'),
(4, 'Iced Americano', 110.00, 'coffee', 5, 'Refreshing espresso over ice with cold water', NULL, 'available', '2025-12-15 07:37:15', '2025-12-15 07:37:15'),
(5, 'Classic Pancakes', 150.00, 'breakfast', 15, 'Fluffy pancakes served with butter and maple syrup', NULL, 'available', '2025-12-15 07:37:15', '2025-12-15 07:37:15'),
(6, 'English Breakfast', 280.00, 'breakfast', 20, 'Eggs, bacon, sausage, beans, tomato, and toast', NULL, 'available', '2025-12-15 07:37:15', '2025-12-15 07:37:15'),
(7, 'Breakfast Burrito', 195.00, 'breakfast', 15, 'Scrambled eggs, cheese, and veggies wrapped in a tortilla', NULL, 'available', '2025-12-15 07:37:15', '2025-12-15 07:37:15'),
(8, 'French Toast', 165.00, 'breakfast', 12, 'Golden brioche bread with cinnamon and powdered sugar', NULL, 'available', '2025-12-15 07:37:15', '2025-12-15 07:37:15'),
(9, 'Mojito', 220.00, 'cocktails', 5, 'Refreshing rum cocktail with mint, lime, and soda', NULL, 'available', '2025-12-15 07:37:15', '2025-12-15 07:37:15'),
(10, 'Margarita', 235.00, 'cocktails', 5, 'Classic tequila cocktail with lime and triple sec', NULL, 'available', '2025-12-15 07:37:15', '2025-12-15 07:37:15'),
(11, 'Piña Colada', 245.00, 'cocktails', 7, 'Tropical blend of rum, coconut cream, and pineapple', NULL, 'available', '2025-12-15 07:37:15', '2025-12-15 07:37:15'),
(12, 'Mixed Platter Tower', 1250.00, 'tower', 35, 'Spectacular tower of mixed appetizers, perfect for sharing', NULL, 'available', '2025-12-15 07:37:15', '2025-12-15 07:37:15'),
(13, 'Seafood Tower', 1850.00, 'tower', 40, 'Premium seafood selection arranged in tower style', NULL, 'available', '2025-12-15 07:37:15', '2025-12-15 07:37:15'),
(14, 'Grilled Salmon', 485.00, 'seafood', 25, 'Fresh salmon fillet grilled to perfection with herbs', NULL, 'available', '2025-12-15 07:37:15', '2025-12-15 07:37:15'),
(15, 'Garlic Butter Shrimp', 395.00, 'seafood', 18, 'Succulent shrimp sautéed in garlic butter sauce', NULL, 'available', '2025-12-15 07:37:15', '2025-12-15 07:37:15'),
(16, 'Fish and Chips', 325.00, 'seafood', 20, 'Crispy battered fish with golden fries', NULL, 'available', '2025-12-15 07:37:15', '2025-12-15 07:37:15'),
(17, 'Seafood Paella', 550.00, 'seafood', 35, 'Spanish rice dish with mixed seafood and saffron', NULL, 'available', '2025-12-15 07:37:15', '2025-12-15 07:37:15'),
(18, 'Crispy Fried Chicken', 245.00, 'chicken', 20, 'Golden fried chicken with secret spice blend', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(19, 'Chicken Wings', 285.00, 'chicken', 18, 'Spicy buffalo wings with ranch dip', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(20, 'Grilled Chicken Breast', 265.00, 'chicken', 22, 'Tender grilled chicken breast with vegetables', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(21, 'Chicken Parmesan', 315.00, 'chicken', 25, 'Breaded chicken with marinara and melted cheese', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(22, 'French Fries', 95.00, 'snacks', 10, 'Crispy golden fries with ketchup', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(23, 'Onion Rings', 115.00, 'snacks', 12, 'Crispy battered onion rings', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(24, 'Mozzarella Sticks', 145.00, 'snacks', 12, 'Breaded mozzarella with marinara sauce', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(25, 'Nachos Supreme', 185.00, 'snacks', 15, 'Tortilla chips with cheese, salsa, and toppings', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(26, 'BBQ Pork Ribs', 425.00, 'pork', 30, 'Tender pork ribs with smoky BBQ glaze', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(27, 'Pork Chop', 295.00, 'pork', 20, 'Grilled pork chop with apple sauce', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(28, 'Crispy Pata', 685.00, 'pork', 45, 'Deep-fried pork knuckle, Filipino style', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(29, 'Beef Steak', 595.00, 'beef', 25, 'Premium ribeye steak cooked to your preference', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(30, 'Beef Burger', 245.00, 'beef', 18, 'Juicy beef patty with cheese, lettuce, and tomato', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(31, 'Beef Taco', 185.00, 'beef', 15, 'Seasoned ground beef in crispy taco shells', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(32, 'Carbonara', 275.00, 'pasta', 18, 'Creamy pasta with bacon and parmesan', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(33, 'Bolognese', 295.00, 'pasta', 20, 'Classic meat sauce with spaghetti', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(34, 'Alfredo Pasta', 285.00, 'pasta', 18, 'Fettuccine in rich Alfredo sauce', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(35, 'Seafood Marinara', 385.00, 'pasta', 25, 'Mixed seafood in tomato sauce with pasta', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(36, 'Caesar Salad', 165.00, 'vegetables', 10, 'Fresh romaine lettuce with Caesar dressing and croutons', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(37, 'Greek Salad', 175.00, 'vegetables', 10, 'Mediterranean salad with feta cheese and olives', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(38, 'Grilled Vegetables', 195.00, 'vegetables', 15, 'Seasonal vegetables grilled with herbs', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(39, 'Emperador Light', 185.00, 'brandy', 2, 'Premium Filipino brandy, smooth and mellow', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(40, 'Fundador', 295.00, 'brandy', 2, 'Spanish brandy with rich flavor', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(41, 'Jack Daniels', 325.00, 'whiskey', 2, 'Classic Tennessee whiskey, smooth and bold', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(42, 'Johnnie Walker Black Label', 385.00, 'whiskey', 2, 'Premium blended Scotch whisky', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16'),
(43, 'Jameson', 295.00, 'whiskey', 2, 'Smooth Irish whiskey, triple distilled', NULL, 'available', '2025-12-15 07:37:16', '2025-12-15 07:37:16');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `sender_id` bigint(20) UNSIGNED NOT NULL,
  `receiver_id` bigint(20) UNSIGNED NOT NULL,
  `message` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2024_10_20_000001_create_invoices_table', 1),
(5, '2024_10_20_000002_create_invoice_items_table', 1),
(6, '2025_08_18_131507_create_rooms_table', 1),
(7, '2025_08_20_143153_create_booking_table', 1),
(8, '2025_08_24_071511_create_events_table', 1),
(9, '2025_08_24_072335_create_inventories_table', 1),
(10, '2025_08_24_072941_create_menus_table', 1),
(11, '2025_08_24_075416_create_orders_table', 1),
(12, '2025_09_05_160713_task', 1),
(13, '2025_09_06_000001_create_attendances_table', 1),
(14, '2025_09_07_092307_create_order_items_table', 1),
(15, '2025_09_15_220000_create_feedbacks_table', 1),
(16, '2025_10_20_143227_create_messages_table', 1),
(17, '2025_12_13_135039_add_sentiment_to_feedbacks_table', 1),
(18, '2025_12_14_125438_create_inventory_logs_table', 1),
(19, '2025_12_14_131115_add_expense_tracking_to_inventory_logs_table', 1),
(20, '2025_12_15_134020_add_missing_columns_to_feedbacks_table', 1),
(21, '2025_12_15_140000_add_paymongo_fields_to_booking_table', 1),
(22, '2025_12_15_154233_add_email_to_booking_table', 2);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `service_type` enum('room','table') NOT NULL DEFAULT 'room',
  `room_number` varchar(255) DEFAULT NULL,
  `table_number` varchar(255) DEFAULT NULL,
  `customerName` varchar(255) NOT NULL DEFAULT 'Guest',
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'JSON array of order items containing menu_id, quantity, price, subtotal' CHECK (json_valid(`items`)),
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON array of image paths corresponding to order items' CHECK (json_valid(`images`)),
  `subtotal` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `notes` text DEFAULT NULL,
  `is_senior_citizen` tinyint(1) NOT NULL DEFAULT 0,
  `payment_method` enum('cash','card','mobile') NOT NULL DEFAULT 'cash',
  `payment_status` enum('pending','processing','completed','failed') DEFAULT NULL,
  `status` enum('pending','processing','completed','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `password_reset_tokens`
--

INSERT INTO `password_reset_tokens` (`email`, `token`, `created_at`) VALUES
('ilagancar19@gmail.com', '$2y$12$gVvIdyhbbS/uber1i562DOxIkpjcS5G12seCrsz6xIluTaNeepYjC', '2025-12-15 08:21:36'),
('ilagancarl19@gmail.com', '$2y$12$OXoDRZej2P/Otp2MKpzKCesXatVW4aRTtZ.83E11jkX7k.w1VnVjW', '2025-12-15 08:23:13');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `roomNumber` varchar(255) NOT NULL,
  `roomType` enum('standard','deluxe','suite','executive','presidential') NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `extra_bed_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `capacity` int(11) NOT NULL DEFAULT 2,
  `status` enum('available','occupied','maintenance') NOT NULL DEFAULT 'available',
  `amenities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`amenities`)),
  `description` text NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `additionalImages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`additionalImages`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `roomNumber`, `roomType`, `price`, `extra_bed_price`, `capacity`, `status`, `amenities`, `description`, `image`, `additionalImages`, `created_at`, `updated_at`) VALUES
(1, '101', 'standard', 2500.00, 0.00, 2, 'occupied', '\"{\\\"wifi\\\":true,\\\"tv\\\":true,\\\"airCon\\\":true,\\\"minibar\\\":false,\\\"bathtub\\\":false,\\\"hairDryer\\\":false,\\\"breakfast\\\":false,\\\"balcony\\\":false,\\\"toiletries\\\":false,\\\"parking\\\":false}\"', 'Comfortable standard room', 'rooms/m6eONXpRuGjB7saQ1RGgGpfFPP6ZtjiZYSFzIB8o.jpg', '\"[\\\"rooms\\\\\\/m6eONXpRuGjB7saQ1RGgGpfFPP6ZtjiZYSFzIB8o.jpg\\\"]\"', '2025-12-15 07:34:30', '2025-12-15 10:24:27'),
(2, '102', 'standard', 2500.00, 0.00, 2, 'available', '\"[\\\"Free Wi-Fi\\\",\\\"Air Conditioning\\\",\\\"TV\\\",\\\"Private Bathroom\\\"]\"', 'Comfortable standard room', NULL, NULL, '2025-12-15 07:34:30', '2025-12-15 07:34:30'),
(3, '103', 'standard', 2500.00, 0.00, 2, 'available', '\"[\\\"Free Wi-Fi\\\",\\\"Air Conditioning\\\",\\\"TV\\\",\\\"Private Bathroom\\\"]\"', 'Comfortable standard room', NULL, NULL, '2025-12-15 07:34:30', '2025-12-15 07:34:30'),
(4, '104', 'standard', 2500.00, 0.00, 2, 'available', '\"[\\\"Free Wi-Fi\\\",\\\"Air Conditioning\\\",\\\"TV\\\",\\\"Private Bathroom\\\"]\"', 'Comfortable standard room', NULL, NULL, '2025-12-15 07:34:30', '2025-12-15 07:34:30'),
(5, '201', 'deluxe', 3500.00, 0.00, 3, 'available', '\"[\\\"Free Wi-Fi\\\",\\\"Air Conditioning\\\",\\\"Smart TV\\\",\\\"Mini Bar\\\",\\\"Private Bathroom\\\",\\\"Work Desk\\\"]\"', 'Spacious deluxe room with premium amenities', NULL, NULL, '2025-12-15 07:34:30', '2025-12-15 07:34:30'),
(6, '202', 'deluxe', 3500.00, 0.00, 3, 'available', '\"[\\\"Free Wi-Fi\\\",\\\"Air Conditioning\\\",\\\"Smart TV\\\",\\\"Mini Bar\\\",\\\"Private Bathroom\\\",\\\"Work Desk\\\"]\"', 'Spacious deluxe room with premium amenities', NULL, NULL, '2025-12-15 07:34:30', '2025-12-15 07:34:30'),
(7, '203', 'deluxe', 3500.00, 0.00, 3, 'occupied', '\"[\\\"Free Wi-Fi\\\",\\\"Air Conditioning\\\",\\\"Smart TV\\\",\\\"Mini Bar\\\",\\\"Private Bathroom\\\",\\\"Work Desk\\\"]\"', 'Spacious deluxe room with premium amenities', NULL, NULL, '2025-12-15 07:34:30', '2025-12-15 09:00:03'),
(8, '301', 'suite', 5000.00, 0.00, 4, 'available', '\"[\\\"Free Wi-Fi\\\",\\\"Air Conditioning\\\",\\\"Smart TV\\\",\\\"Mini Bar\\\",\\\"Private Bathroom\\\",\\\"Living Room\\\",\\\"Balcony\\\",\\\"Coffee Maker\\\"]\"', 'Luxurious suite with separate living area', NULL, NULL, '2025-12-15 07:34:30', '2025-12-15 07:34:30'),
(9, '302', 'suite', 5000.00, 0.00, 4, 'available', '\"[\\\"Free Wi-Fi\\\",\\\"Air Conditioning\\\",\\\"Smart TV\\\",\\\"Mini Bar\\\",\\\"Private Bathroom\\\",\\\"Living Room\\\",\\\"Balcony\\\",\\\"Coffee Maker\\\"]\"', 'Luxurious suite with separate living area', NULL, NULL, '2025-12-15 07:34:30', '2025-12-15 07:34:30'),
(10, '401', 'executive', 4500.00, 0.00, 4, 'available', '\"[\\\"Free Wi-Fi\\\",\\\"Air Conditioning\\\",\\\"TV\\\",\\\"Private Bathroom\\\",\\\"Work Desk\\\",\\\"Coffee Maker\\\"]\"', 'Executive room perfect for business travelers', NULL, NULL, '2025-12-15 07:34:30', '2025-12-15 07:34:30'),
(11, '402', 'executive', 4500.00, 0.00, 4, 'available', '\"[\\\"Free Wi-Fi\\\",\\\"Air Conditioning\\\",\\\"TV\\\",\\\"Private Bathroom\\\",\\\"Work Desk\\\",\\\"Coffee Maker\\\"]\"', 'Executive room perfect for business travelers', NULL, NULL, '2025-12-15 07:34:30', '2025-12-15 07:34:30');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('0rC7OkRC96Anu5F6mdoNR2qeBCQlhZQWLuGbotgi', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoibTFIbjRiU1F4ejNzd3dyR2tSU2pwMGI0eWY1aXBPZ3JDclZDWEloMiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765816076),
('0ZlSh2YwphJfRQTokRKhvNzdDe0UQkBEMW99a3Je', NULL, '127.0.0.1', '', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiRll6NkdTU3R1ZnA4WVZrWDhxVTNza3FneTRoV0szaTdhWHBhU2NWYyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765818003),
('0ZVyqYKQxjbdK9cIpCJVzEIVLW63fIRE0CdjzDiW', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoid2FWZklLN1dycjg4TEJ0Skh2UmpUQmpnU1RnREpQbGlYaWxicTRZWSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765818364),
('21037O41oZDsuccFjAH3MAMBYvmixVThAjOrtxfc', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiMlk5NDdxanhMRzMzZ1BQbktxdzFBc2FmZXRjVGNEUWdFdG14czBRWiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765816115),
('3KCR0NFLeu1gDdkGYSFfJTeEAdIMnw1lCw3QWwUC', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiaXJ3NkMzMEl0amdXeHc5VzBPN1ZuMzlpc0lXZkpnZWwzODcyNXFOSCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765818745),
('5oHI0FfbRNXuuH3AzgYqEOz0TRpq78Kvohp0GjHd', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiVTZHTlZGa3Z5SEtUYjQ3bkZsQjdGTllFdWdreDlEdFYwT2lLdjNtTCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765817849),
('80lMPsi3ZFdFlv3O1ZdIXejOBtvX8OREVpQHMr6y', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoicGtxNU1aenVKaVpaMXRBUWVhNUtTSkFVcnFXZFc1M0VIdDU1cFVVNiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765817321),
('c1qPuuAIDi7I1QxR6lfEdCFS26AM5VPmMQBAd21f', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiQVlKcnhBVHVaUW1WVXlXdVJDdHR6TTB2VzY3TjZZRXA3YlcxVXVSbCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765816086),
('D20juD0CRmavxgBBFyn1lLEnECN8LQT9WrwXOse6', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiVlZJOU12VUZWT1NGcUwxTGNqZFpHMmdCMVdJTzhUb0FXVXh2R3NwSyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765818248),
('daUPlH5rQX7eXk1gSmgs5S23kf44OrRUZMy5Tbd2', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiYlR6clBFV2I1WVhLc2w0QzBvejdIb2dNVEV1TVR0OXJiQnpub2M2NyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765818215),
('dSCTnxrx9hWXicpy0Pbl9McLQwCR2FqodjDNFOPM', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiNmFiOUVzQVB2TmttNmRZVUQ5TUN4NzMxWnk3dUJSSmNpZGF5elh2NyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765817352),
('fcsxvSvQQKsFpVWpbUuXUb7SNoQ1HU70TfPieQyi', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiMnE4T0QzaElKc2xOeVBCTDdlcWFkUGJhVWFqQWZ5RjA2TnViTlJDQiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765817334),
('FSeU7l9JyrdQW95QhrX8pEHIKxZAZNmCOd5iCEIH', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiaU9LMktrbTgza0NPdDJMSFVVZTVLRmRtTXF3MWd0MGJoUksyTWN5VCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765818353),
('fTHQDLPhmyBFSVvUvABkvsMJz17pAGooPzj9f2FW', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiY2NhZUNjT01POVFrTnB2TUhaeVFkd241NE52cVd6R0JVclM4d3R1ZSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765817305),
('FuCURb8i2JDbRsXa1Jto8liNbBEXltrUGByTAC9y', NULL, '127.0.0.1', '', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiUmt4YkxNOFQ5ZkFCTHBLTkJmWXR1cG5xNUJUUUZXaktyWGxDM0hJYyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765818607),
('fVcux46F2sltuMwvzx1KfvoSHGreGcidMJ9Ok8Ug', NULL, '127.0.0.1', '', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiMVFIdXF2cjBsVUpXa1FlRHkxb1A0bHRldVFURHZGaml5ZUlsMUtYcCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765818712),
('fXEX7aCffscwozif9mRnCDL2Vclc7PNlnKLcXIXo', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiTDFsTTJOZGl5aEs3UDFPTmpVd1VBMllEbVVQMjJDZmhmaEJEWFl5QSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765818189),
('gOMR8OatE7EleCwqmuQO4KMSCnPn1EmbnVFgltYl', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoidWRwQXlEbXRUZGY0c0VTY05weE1nSHk3czFEU3VRTVczNEJHRHFCdSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765817387),
('i8ePQFmlkaz5qHvWPGhJBnBsLejEaKEyQtUHNBJp', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiZzlrMW1zQ2xYbzhCVkRQOXRvaXNNa1FiZmxkRVdHTXhwWjRISGI4OCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765817589),
('iyCdTtqr2igiafUr9D3Fc7FelJ5g7nyiy5Qdf3hO', 3, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoiWEJqM2hDcTNaVXJZak5keDk4encwYUpSSmxDaFFYZzQ4ZHNYNzhRdyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO2k6MztzOjk6Il9wcmV2aW91cyI7YToxOntzOjM6InVybCI7czo0MDoiaHR0cDovLzEyNy4wLjAuMTo4MDAwL1N1cGVyQWRtaW4vc2Fyb29tcyI7fX0=', 1765824466),
('j5Cp7IQWZw2yYsolazsPMH3tx3DZD4ZQ9yGQ7j2i', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiMDhQT2JvT0NQeHRBTWNyZ1ltMXFIU1dLZEdZSjc5Q05SOURjTFIydyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765816637),
('ji5DlaAVdC8K0IcYX9fWHPkDkiU7HiuZ9Kx0S4p2', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoidWp0N3Q1MUt1d3pLQlpmSHpyRnBnamlXVDBCbjhYSUc4TFJMcXV3SCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765816094),
('lg6IYUGwztyb37cd1oragZ0RIHzC5QbdM0aexs83', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiV2hDY2JiM0R1Mzg4bjdobndCMHdhWTB0aE5BM292QkJ5VExvQkFMVCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765818209),
('MxgfPIYeKFznG3QWE6APVf9PgisXAAfapTXzCXhM', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.7462', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiREdXaElYeTdRWFgzTmNyeXJrbkFXN0hCOGpSQ3VKVVZ1ZXdBc1VMcCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6NDM6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC93ZWJob29rL3BheW1vbmdvL3Rlc3QiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1765817885),
('nnIldWDQs8d1ydRwH3r3xhA5bAvhp9FFPBNQPeUU', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoidFRVN3lRY0s4NFdTYWlEV0F5b0xteEJ0TndDcmUzcXpFcVdmRDNGbiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765816245),
('nypp8sjltsXo774EknjfvNQYHOg3fv9WE8Bmo7o4', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiMjlkRDJkbDAzZzczQWd1RzUwdnBucTZYZTZUOFFMUk5aQkVTbUkzNiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765818224),
('pLqu0snDab5myMNbKuYAbhSLw9RwDiZFVhrcKqMD', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiVXQzOTNSbmF6d3hqeUZFM3ZJQkViNVd3Wmo3V0U5aURLMmc0TUJjcyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765816180),
('SVZnQbFuvZoHWphLJ35cLOIrhqoqbT5lgTKrUvKB', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiS1cwUjNiS3ZZZVpOdGlvY3Rob3p1RGpwNkVIZkdRRWlldzVsQjZmUCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765818283),
('t0CH8ARNL3gShChgABlVz87zwoZt34BYw9oPsSAI', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiWlRMbmZ4c2xrQ1BEZnBQRUQ0V1RoUDA0RlkzN1lIYWM5aVlpSEpPdCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765817316),
('tf7jaAwbeSxpWRpQC7TSlhVOLftZojCnNiwXcFnT', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoid1Z4SHBwQ3JBY3N5ZGltbU9vcU50Sk11REVlanJnbTVNU1ZjbVZKaSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765816139),
('uFTwBgBkpKy8aUHxOmL84xK3264vDm7An0EWH1GM', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoibWV3cFVtY1ZDQjFpN2tyUDJMQkU3UVRQbEdzRVpZT0cyNHFvRkVsSCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765820240),
('URVhOICoUou1jTEVak7eo07kDCBV0WgG8uYVqYGA', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiVUxUek10ZzNUbk9SSVZJZTFWR29KdXNMUkg2VmZqVE9UczVqWFIyMCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765818483),
('vQdrztJTJMP94SBr37rRwiFZtJR7Q0dS9CzVpzda', NULL, '127.0.0.1', '', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiTGFFMklnRUhqRWp6WTRTeldMdE9VcmpHYlRpMjJ6RzYxaVBvMEJ3QSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765818662),
('w4VocyVO32umqCeXBmYs45dm3zpf6jVJwga9aIWh', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiMDY4VzgyN0wyaVNMWUVjZGZHbUk4VlBRYjY3VnFsdnBzYjNWRnh6ZCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765817455),
('wsBChNEL0qDC8o57iGeWnSXImolUVLMZkEUE1qyg', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiOU80ekxDY01PaFJJemcwWmRRWmVXODdkeG1zSzlyYlRVYU1uNDBWSyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765816379),
('YbOIUy5N6VvT8IbJddd5l6JiYb4HpCFDMPHqgsiM', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiYTE2aFNXaE9oY0JrRFJ5b1h2TEw3RzI1ZHJWZVhnMGxDSmhsanhBWiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765818198),
('YqOEWM4HQldDPJIRgifoos2ECkK2AC4IriprhSNb', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiYmdEWWJIQzRVbWpaeElROUFhUm52WHNoVzVmc1d0Rmt1Y0gxNEdYQiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765819391),
('zy71ZZ8CEUqcqUYZ1ntDQP3oAC2yBeBTkqEaZmzl', NULL, '127.0.0.1', 'Ruby', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiZUM2MDZ5R1pwSVJkVHNJcnFSYkVXMDlFQ3NmWVpKVFE2dzhpSXNlcCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1765817154);

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `status` enum('pending','inprogress','completed') NOT NULL DEFAULT 'pending',
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `notes` text DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `job_title` varchar(255) DEFAULT NULL,
  `phonenumber` varchar(255) DEFAULT NULL,
  `companyname` varchar(255) DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('superadmin','admin','employee','client','kitchen','frontdesk') NOT NULL DEFAULT 'client',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `image`, `name`, `email`, `address`, `department`, `job_title`, `phonenumber`, `companyname`, `salary`, `category`, `email_verified_at`, `password`, `role`, `status`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, NULL, 'Admin User', 'admin@crownsys.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-15 07:32:36', '$2y$12$FK.TN7oikB9aKfmGZwuOq.RCjMYwRNqCfr/w7RmHDFCokabzf4I5O', 'admin', 'active', NULL, '2025-12-15 07:32:36', '2025-12-15 07:32:36'),
(2, NULL, 'Client User', 'ilagancarl19@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '$2y$12$SUYPjkupjvIioDXqRt5lLOjkEQpCQ.4ACrV6WIEKwAJh6aHQpOMXO', 'client', 'active', NULL, '2025-12-15 07:32:36', '2025-12-15 08:21:17'),
(3, NULL, 'Super Admin', 'superadmin@crownsys.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-15 07:32:36', '$2y$12$UtYrO2WYjyhVxvPyAdUZP.qFo.9mOAoUpkz34WcNrd.vFO2BPVQMi', 'superadmin', 'active', NULL, '2025-12-15 07:32:36', '2025-12-15 07:32:36'),
(4, NULL, 'Front Desk', 'frontdesk@crownsys.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-15 07:32:36', '$2y$12$09DYmNlfxXxrspTlze.cau6mKlkkZb99uDbZjN817AX.fyKJXxe6C', 'frontdesk', 'active', NULL, '2025-12-15 07:32:36', '2025-12-15 07:32:36'),
(5, NULL, 'Employee', 'employee@crownsys.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-15 07:32:37', '$2y$12$.QbOvpi.oOGXSjMDCCANw.xI2IzNYhblWqTVyGqwS.8Mu8u/Bp6Ga', 'employee', 'active', NULL, '2025-12-15 07:32:37', '2025-12-15 07:32:37');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance_schedules`
--
ALTER TABLE `attendance_schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `attendance_schedules_employee_id_foreign` (`employee_id`);

--
-- Indexes for table `booking`
--
ALTER TABLE `booking`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `booking_booking_reference_unique` (`booking_reference`),
  ADD KEY `booking_client_id_foreign` (`client_id`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `feedbacks`
--
ALTER TABLE `feedbacks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `inventories`
--
ALTER TABLE `inventories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `inventories_itemcode_unique` (`itemCode`);

--
-- Indexes for table `inventory_logs`
--
ALTER TABLE `inventory_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `inventory_logs_inventory_id_foreign` (`inventory_id`),
  ADD KEY `inventory_logs_performed_by_foreign` (`performed_by`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoices_invoice_number_unique` (`invoice_number`),
  ADD KEY `invoices_invoiceable_type_invoiceable_id_index` (`invoiceable_type`,`invoiceable_id`),
  ADD KEY `invoices_customer_name_index` (`customer_name`),
  ADD KEY `invoices_invoice_date_index` (`invoice_date`),
  ADD KEY `invoices_issued_by_foreign` (`issued_by`),
  ADD KEY `invoices_approved_by_foreign` (`approved_by`),
  ADD KEY `invoices_cancelled_by_foreign` (`cancelled_by`),
  ADD KEY `invoices_invoiceable_type_index` (`invoiceable_type`),
  ADD KEY `invoices_invoiceable_id_index` (`invoiceable_id`),
  ADD KEY `invoices_payment_status_index` (`payment_status`),
  ADD KEY `invoices_status_index` (`status`);

--
-- Indexes for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `invoice_items_invoice_id_index` (`invoice_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `menu`
--
ALTER TABLE `menu`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `messages_receiver_id_foreign` (`receiver_id`),
  ADD KEY `messages_sender_id_receiver_id_index` (`sender_id`,`receiver_id`),
  ADD KEY `messages_created_at_index` (`created_at`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `rooms_roomnumber_unique` (`roomNumber`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tasks_employee_id_foreign` (`employee_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendance_schedules`
--
ALTER TABLE `attendance_schedules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `booking`
--
ALTER TABLE `booking`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `feedbacks`
--
ALTER TABLE `feedbacks`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventories`
--
ALTER TABLE `inventories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `inventory_logs`
--
ALTER TABLE `inventory_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `invoice_items`
--
ALTER TABLE `invoice_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `menu`
--
ALTER TABLE `menu`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance_schedules`
--
ALTER TABLE `attendance_schedules`
  ADD CONSTRAINT `attendance_schedules_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `booking`
--
ALTER TABLE `booking`
  ADD CONSTRAINT `booking_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `inventory_logs`
--
ALTER TABLE `inventory_logs`
  ADD CONSTRAINT `inventory_logs_inventory_id_foreign` FOREIGN KEY (`inventory_id`) REFERENCES `inventories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_logs_performed_by_foreign` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `invoices_cancelled_by_foreign` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `invoices_issued_by_foreign` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD CONSTRAINT `invoice_items_invoice_id_foreign` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_receiver_id_foreign` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_sender_id_foreign` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
