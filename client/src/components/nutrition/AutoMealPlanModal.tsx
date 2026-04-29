import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ChevronDown, Utensils, Check } from "lucide-react";
import { addEntry, type MealType } from "@/lib/nutritionStore";
import { readEnergySettings, calculateTarget, type Goal } from "@/lib/energySettingsStore";
import { useTheme } from "@/context/ThemeContext";

type DietType = "standard" | "vegan" | "vegetarian" | "keto" | "paleo" | "mediterranean" | "high_protein";

const DIET_LABELS: Record<DietType, string> = {
  standard: "Standard",
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  keto: "Keto",
  paleo: "Paleo",
  mediterranean: "Mediterranean",
  high_protein: "High Protein",
};

interface MealItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingLabel: string;
  mealType: MealType;
}

type DayPlan = MealItem[];

const PLANS: Record<DietType, Record<Goal, DayPlan>> = {
  standard: {
    lose: [
      { name: "Scrambled Eggs (2)", calories: 144, protein: 12.6, carbs: 0.8, fat: 9.6, servingLabel: "2 large eggs", mealType: "breakfast" },
      { name: "Whole Wheat Toast", calories: 81, protein: 4, carbs: 14, fat: 1.1, servingLabel: "1 slice (32g)", mealType: "breakfast" },
      { name: "Black Coffee", calories: 2, protein: 0.3, carbs: 0, fat: 0, servingLabel: "1 cup", mealType: "breakfast" },
      { name: "Grilled Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, servingLabel: "100 g", mealType: "lunch" },
      { name: "Broccoli (steamed)", calories: 55, protein: 3.7, carbs: 11, fat: 0.6, servingLabel: "1 cup (156g)", mealType: "lunch" },
      { name: "Brown Rice (cooked)", calories: 150, protein: 3, carbs: 32, fat: 1, servingLabel: "¾ cup (145g)", mealType: "lunch" },
      { name: "Salmon Fillet", calories: 208, protein: 22, carbs: 0, fat: 13, servingLabel: "100 g", mealType: "dinner" },
      { name: "Asparagus (roasted)", calories: 40, protein: 4, carbs: 7, fat: 0.4, servingLabel: "1 cup (134g)", mealType: "dinner" },
      { name: "Greek Yogurt (plain)", calories: 100, protein: 17, carbs: 6, fat: 0.7, servingLabel: "170 g", mealType: "snacks" },
      { name: "Apple", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, servingLabel: "1 medium", mealType: "snacks" },
    ],
    maintain: [
      { name: "Oatmeal (cooked)", calories: 150, protein: 5, carbs: 27, fat: 2.5, servingLabel: "1 cup (234g)", mealType: "breakfast" },
      { name: "Banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, servingLabel: "1 medium", mealType: "breakfast" },
      { name: "Milk (2%)", calories: 122, protein: 8, carbs: 12, fat: 5, servingLabel: "1 cup", mealType: "breakfast" },
      { name: "Grilled Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, servingLabel: "100 g", mealType: "lunch" },
      { name: "White Rice (cooked)", calories: 206, protein: 4.3, carbs: 45, fat: 0.4, servingLabel: "1 cup (158g)", mealType: "lunch" },
      { name: "Salad Mix + Olive Oil", calories: 100, protein: 2, carbs: 5, fat: 9, servingLabel: "1 serving", mealType: "lunch" },
      { name: "Baked Salmon", calories: 208, protein: 22, carbs: 0, fat: 13, servingLabel: "100 g", mealType: "dinner" },
      { name: "Sweet Potato (baked)", calories: 112, protein: 2, carbs: 26, fat: 0.1, servingLabel: "1 medium (130g)", mealType: "dinner" },
      { name: "Mixed Vegetables", calories: 60, protein: 3, carbs: 12, fat: 0.5, servingLabel: "1 cup", mealType: "dinner" },
      { name: "Almonds", calories: 164, protein: 6, carbs: 6, fat: 14, servingLabel: "28 g (1 oz)", mealType: "snacks" },
      { name: "Greek Yogurt (plain)", calories: 100, protein: 17, carbs: 6, fat: 0.7, servingLabel: "170 g", mealType: "snacks" },
    ],
    gain: [
      { name: "Oatmeal (cooked)", calories: 300, protein: 10, carbs: 54, fat: 5, servingLabel: "2 cups", mealType: "breakfast" },
      { name: "Whole Eggs (3)", calories: 216, protein: 18.9, carbs: 1.2, fat: 14.4, servingLabel: "3 large eggs", mealType: "breakfast" },
      { name: "Milk (whole)", calories: 149, protein: 8, carbs: 12, fat: 8, servingLabel: "1 cup", mealType: "breakfast" },
      { name: "Chicken Breast (large)", calories: 330, protein: 62, carbs: 0, fat: 7.2, servingLabel: "200 g", mealType: "lunch" },
      { name: "White Rice (cooked)", calories: 412, protein: 8.6, carbs: 90, fat: 0.8, servingLabel: "2 cups", mealType: "lunch" },
      { name: "Avocado", calories: 240, protein: 3, carbs: 12, fat: 22, servingLabel: "1 fruit (150g)", mealType: "lunch" },
      { name: "Ground Beef (lean)", calories: 250, protein: 26, carbs: 0, fat: 15, servingLabel: "100 g", mealType: "dinner" },
      { name: "Pasta (cooked)", calories: 220, protein: 8, carbs: 43, fat: 1.3, servingLabel: "1 cup (140g)", mealType: "dinner" },
      { name: "Olive Oil", calories: 120, protein: 0, carbs: 0, fat: 14, servingLabel: "1 tbsp", mealType: "dinner" },
      { name: "Almonds", calories: 328, protein: 12, carbs: 12, fat: 28, servingLabel: "56 g (2 oz)", mealType: "snacks" },
      { name: "Protein Shake (whey)", calories: 130, protein: 25, carbs: 5, fat: 2, servingLabel: "1 scoop (30g)", mealType: "snacks" },
    ],
  },
  vegan: {
    lose: [
      { name: "Smoothie (banana + almond milk)", calories: 180, protein: 4, carbs: 38, fat: 3, servingLabel: "1 serving", mealType: "breakfast" },
      { name: "Chia Seeds", calories: 69, protein: 2.4, carbs: 6, fat: 4.4, servingLabel: "1 tbsp (15g)", mealType: "breakfast" },
      { name: "Lentil Soup", calories: 230, protein: 18, carbs: 39, fat: 1, servingLabel: "1.5 cups", mealType: "lunch" },
      { name: "Spinach Salad", calories: 35, protein: 4, carbs: 4, fat: 0.5, servingLabel: "2 cups (60g)", mealType: "lunch" },
      { name: "Chickpea Stir-Fry", calories: 270, protein: 14, carbs: 42, fat: 5, servingLabel: "1 serving", mealType: "dinner" },
      { name: "Steamed Broccoli", calories: 55, protein: 3.7, carbs: 11, fat: 0.6, servingLabel: "1 cup", mealType: "dinner" },
      { name: "Apple", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, servingLabel: "1 medium", mealType: "snacks" },
      { name: "Pumpkin Seeds", calories: 126, protein: 5, carbs: 5, fat: 5.5, servingLabel: "28g", mealType: "snacks" },
    ],
    maintain: [
      { name: "Tofu Scramble", calories: 180, protein: 15, carbs: 6, fat: 10, servingLabel: "150 g tofu", mealType: "breakfast" },
      { name: "Whole Wheat Toast", calories: 162, protein: 8, carbs: 28, fat: 2.2, servingLabel: "2 slices", mealType: "breakfast" },
      { name: "Almond Butter", calories: 98, protein: 3.4, carbs: 3, fat: 9, servingLabel: "1 tbsp (16g)", mealType: "breakfast" },
      { name: "Quinoa (cooked)", calories: 222, protein: 8, carbs: 39, fat: 3.5, servingLabel: "1 cup", mealType: "lunch" },
      { name: "Black Beans", calories: 150, protein: 10, carbs: 27, fat: 0.5, servingLabel: "½ cup cooked", mealType: "lunch" },
      { name: "Roasted Vegetables", calories: 100, protein: 3, carbs: 20, fat: 2, servingLabel: "1 cup", mealType: "lunch" },
      { name: "Tempeh", calories: 195, protein: 18, carbs: 11, fat: 11, servingLabel: "100 g", mealType: "dinner" },
      { name: "Brown Rice (cooked)", calories: 200, protein: 4, carbs: 42, fat: 1.5, servingLabel: "1 cup", mealType: "dinner" },
      { name: "Edamame", calories: 120, protein: 11, carbs: 9, fat: 5, servingLabel: "½ cup", mealType: "snacks" },
      { name: "Banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, servingLabel: "1 medium", mealType: "snacks" },
    ],
    gain: [
      { name: "Oatmeal with Peanut Butter", calories: 350, protein: 13, carbs: 45, fat: 14, servingLabel: "1 large bowl", mealType: "breakfast" },
      { name: "Banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, servingLabel: "1 medium", mealType: "breakfast" },
      { name: "Soy Protein Shake", calories: 130, protein: 24, carbs: 8, fat: 2, servingLabel: "1 scoop", mealType: "breakfast" },
      { name: "Lentils (cooked)", calories: 300, protein: 24, carbs: 51, fat: 1, servingLabel: "1.5 cups", mealType: "lunch" },
      { name: "Quinoa (cooked)", calories: 222, protein: 8, carbs: 39, fat: 3.5, servingLabel: "1 cup", mealType: "lunch" },
      { name: "Avocado", calories: 240, protein: 3, carbs: 12, fat: 22, servingLabel: "1 fruit", mealType: "lunch" },
      { name: "Tofu (firm)", calories: 280, protein: 28, carbs: 8, fat: 16, servingLabel: "200 g", mealType: "dinner" },
      { name: "Sweet Potato", calories: 160, protein: 3, carbs: 37, fat: 0.2, servingLabel: "1 large", mealType: "dinner" },
      { name: "Tahini Sauce", calories: 90, protein: 2.7, carbs: 3, fat: 8, servingLabel: "1 tbsp", mealType: "dinner" },
      { name: "Mixed Nuts", calories: 200, protein: 5, carbs: 8, fat: 18, servingLabel: "40g", mealType: "snacks" },
      { name: "Dates", calories: 120, protein: 1, carbs: 32, fat: 0, servingLabel: "4 dates (40g)", mealType: "snacks" },
    ],
  },
  vegetarian: {
    lose: [
      { name: "Greek Yogurt (plain)", calories: 100, protein: 17, carbs: 6, fat: 0.7, servingLabel: "170 g", mealType: "breakfast" },
      { name: "Berries (mixed)", calories: 70, protein: 1, carbs: 16, fat: 0.5, servingLabel: "1 cup (150g)", mealType: "breakfast" },
      { name: "Egg White Omelette", calories: 100, protein: 18, carbs: 1, fat: 1, servingLabel: "4 egg whites", mealType: "lunch" },
      { name: "Spinach + Feta Salad", calories: 130, protein: 7, carbs: 5, fat: 9, servingLabel: "1 serving", mealType: "lunch" },
      { name: "Cottage Cheese Stir-Fry", calories: 220, protein: 20, carbs: 12, fat: 8, servingLabel: "1 serving", mealType: "dinner" },
      { name: "Steamed Green Beans", calories: 45, protein: 2, carbs: 10, fat: 0.2, servingLabel: "1 cup", mealType: "dinner" },
      { name: "Almonds", calories: 82, protein: 3, carbs: 3, fat: 7, servingLabel: "14g (½ oz)", mealType: "snacks" },
      { name: "Apple", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, servingLabel: "1 medium", mealType: "snacks" },
    ],
    maintain: [
      { name: "Egg Omelette (2 eggs)", calories: 160, protein: 14, carbs: 1, fat: 11, servingLabel: "2 large eggs", mealType: "breakfast" },
      { name: "Whole Wheat Toast", calories: 81, protein: 4, carbs: 14, fat: 1.1, servingLabel: "1 slice", mealType: "breakfast" },
      { name: "Orange Juice", calories: 112, protein: 1.7, carbs: 26, fat: 0.5, servingLabel: "1 cup (248g)", mealType: "breakfast" },
      { name: "Paneer (grilled)", calories: 260, protein: 17, carbs: 3, fat: 20, servingLabel: "100 g", mealType: "lunch" },
      { name: "Brown Rice (cooked)", calories: 200, protein: 4, carbs: 42, fat: 1.5, servingLabel: "1 cup", mealType: "lunch" },
      { name: "Mixed Vegetable Curry", calories: 150, protein: 4, carbs: 22, fat: 6, servingLabel: "1 cup", mealType: "lunch" },
      { name: "Pasta with Marinara", calories: 280, protein: 10, carbs: 50, fat: 3, servingLabel: "1.5 cups", mealType: "dinner" },
      { name: "Parmesan Cheese", calories: 88, protein: 8, carbs: 1, fat: 6, servingLabel: "30g", mealType: "dinner" },
      { name: "Greek Yogurt (plain)", calories: 100, protein: 17, carbs: 6, fat: 0.7, servingLabel: "170g", mealType: "snacks" },
      { name: "Granola", calories: 150, protein: 4, carbs: 25, fat: 5, servingLabel: "40g", mealType: "snacks" },
    ],
    gain: [
      { name: "Protein Pancakes (egg + oat)", calories: 350, protein: 22, carbs: 42, fat: 10, servingLabel: "3 pancakes", mealType: "breakfast" },
      { name: "Milk (whole)", calories: 149, protein: 8, carbs: 12, fat: 8, servingLabel: "1 cup", mealType: "breakfast" },
      { name: "Paneer Curry", calories: 380, protein: 22, carbs: 20, fat: 25, servingLabel: "200g paneer", mealType: "lunch" },
      { name: "Basmati Rice", calories: 280, protein: 6, carbs: 60, fat: 0.5, servingLabel: "1.5 cups cooked", mealType: "lunch" },
      { name: "Whole Eggs (3)", calories: 216, protein: 18.9, carbs: 1.2, fat: 14.4, servingLabel: "3 large eggs", mealType: "dinner" },
      { name: "Pasta with Cheese", calories: 400, protein: 18, carbs: 55, fat: 14, servingLabel: "2 cups", mealType: "dinner" },
      { name: "Mixed Nuts", calories: 200, protein: 5, carbs: 8, fat: 18, servingLabel: "40g", mealType: "snacks" },
      { name: "Whey Protein Shake", calories: 130, protein: 25, carbs: 5, fat: 2, servingLabel: "1 scoop", mealType: "snacks" },
    ],
  },
  keto: {
    lose: [
      { name: "Scrambled Eggs (3)", calories: 216, protein: 18.9, carbs: 1.2, fat: 14.4, servingLabel: "3 large eggs", mealType: "breakfast" },
      { name: "Bacon (2 strips)", calories: 86, protein: 6, carbs: 0, fat: 7, servingLabel: "2 strips (22g)", mealType: "breakfast" },
      { name: "Avocado", calories: 120, protein: 1.5, carbs: 6, fat: 11, servingLabel: "½ fruit", mealType: "breakfast" },
      { name: "Grilled Chicken Thigh", calories: 210, protein: 26, carbs: 0, fat: 12, servingLabel: "100 g", mealType: "lunch" },
      { name: "Caesar Salad (no croutons)", calories: 170, protein: 3, carbs: 4, fat: 16, servingLabel: "1 large bowl", mealType: "lunch" },
      { name: "Salmon (baked)", calories: 208, protein: 22, carbs: 0, fat: 13, servingLabel: "100 g", mealType: "dinner" },
      { name: "Zucchini (sautéed, butter)", calories: 80, protein: 2, carbs: 5, fat: 6, servingLabel: "1 cup", mealType: "dinner" },
      { name: "Almonds", calories: 82, protein: 3, carbs: 3, fat: 7, servingLabel: "14g", mealType: "snacks" },
      { name: "String Cheese", calories: 80, protein: 7, carbs: 1, fat: 5, servingLabel: "1 stick (28g)", mealType: "snacks" },
    ],
    maintain: [
      { name: "Eggs (3) + Cheese", calories: 280, protein: 22, carbs: 1.5, fat: 21, servingLabel: "1 serving", mealType: "breakfast" },
      { name: "Avocado", calories: 240, protein: 3, carbs: 12, fat: 22, servingLabel: "1 fruit", mealType: "breakfast" },
      { name: "Tuna Salad (mayo)", calories: 280, protein: 28, carbs: 2, fat: 18, servingLabel: "1 can + 1 tbsp mayo", mealType: "lunch" },
      { name: "Lettuce Wraps", calories: 20, protein: 1, carbs: 3, fat: 0.2, servingLabel: "4 large leaves", mealType: "lunch" },
      { name: "Ribeye Steak", calories: 280, protein: 28, carbs: 0, fat: 18, servingLabel: "100 g", mealType: "dinner" },
      { name: "Cauliflower Mash (butter)", calories: 130, protein: 3, carbs: 8, fat: 10, servingLabel: "1 cup", mealType: "dinner" },
      { name: "Walnuts", calories: 185, protein: 4.3, carbs: 3.9, fat: 18.5, servingLabel: "28g", mealType: "snacks" },
      { name: "Full-fat Cheese", calories: 113, protein: 7, carbs: 0.4, fat: 9, servingLabel: "30g", mealType: "snacks" },
    ],
    gain: [
      { name: "Eggs (4) + Sausage", calories: 450, protein: 30, carbs: 2, fat: 36, servingLabel: "1 large breakfast", mealType: "breakfast" },
      { name: "Heavy Cream Coffee", calories: 100, protein: 0.5, carbs: 1, fat: 11, servingLabel: "1 cup + 2 tbsp cream", mealType: "breakfast" },
      { name: "Ground Beef (80/20)", calories: 300, protein: 22, carbs: 0, fat: 23, servingLabel: "120 g", mealType: "lunch" },
      { name: "Avocado", calories: 240, protein: 3, carbs: 12, fat: 22, servingLabel: "1 fruit", mealType: "lunch" },
      { name: "Full-fat Cheese", calories: 225, protein: 14, carbs: 0.8, fat: 18, servingLabel: "60g", mealType: "lunch" },
      { name: "Salmon (baked, large)", calories: 416, protein: 44, carbs: 0, fat: 26, servingLabel: "200 g", mealType: "dinner" },
      { name: "Broccoli + Butter", calories: 120, protein: 4, carbs: 11, fat: 8, servingLabel: "1 cup + 1 tbsp butter", mealType: "dinner" },
      { name: "Macadamia Nuts", calories: 240, protein: 2.7, carbs: 4.5, fat: 25, servingLabel: "40g", mealType: "snacks" },
      { name: "Pepperoni + Cheese", calories: 200, protein: 10, carbs: 1, fat: 18, servingLabel: "1 serving", mealType: "snacks" },
    ],
  },
  paleo: {
    lose: [
      { name: "Scrambled Eggs (2)", calories: 144, protein: 12.6, carbs: 0.8, fat: 9.6, servingLabel: "2 large eggs", mealType: "breakfast" },
      { name: "Berries (mixed)", calories: 70, protein: 1, carbs: 16, fat: 0.5, servingLabel: "1 cup", mealType: "breakfast" },
      { name: "Grilled Chicken + Sweet Potato", calories: 280, protein: 33, carbs: 26, fat: 4, servingLabel: "100g chicken + 1 medium potato", mealType: "lunch" },
      { name: "Cucumber + Guacamole", calories: 100, protein: 2, carbs: 8, fat: 7, servingLabel: "½ cucumber + 2 tbsp guac", mealType: "lunch" },
      { name: "Baked Salmon", calories: 208, protein: 22, carbs: 0, fat: 13, servingLabel: "100 g", mealType: "dinner" },
      { name: "Roasted Asparagus", calories: 40, protein: 4, carbs: 7, fat: 0.4, servingLabel: "1 cup", mealType: "dinner" },
      { name: "Walnuts", calories: 92, protein: 2.2, carbs: 1.9, fat: 9.2, servingLabel: "14g", mealType: "snacks" },
      { name: "Apple", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, servingLabel: "1 medium", mealType: "snacks" },
    ],
    maintain: [
      { name: "Veggie + Egg Frittata", calories: 250, protein: 18, carbs: 8, fat: 16, servingLabel: "1 serving (3 eggs)", mealType: "breakfast" },
      { name: "Orange", calories: 62, protein: 1.2, carbs: 15, fat: 0.2, servingLabel: "1 medium", mealType: "breakfast" },
      { name: "Grilled Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, servingLabel: "100 g", mealType: "lunch" },
      { name: "Sweet Potato (baked)", calories: 112, protein: 2, carbs: 26, fat: 0.1, servingLabel: "1 medium", mealType: "lunch" },
      { name: "Steamed Broccoli + Olive Oil", calories: 90, protein: 4, carbs: 11, fat: 5, servingLabel: "1 cup + ½ tbsp oil", mealType: "lunch" },
      { name: "Grass-Fed Beef (lean)", calories: 215, protein: 26, carbs: 0, fat: 12, servingLabel: "100 g", mealType: "dinner" },
      { name: "Sautéed Spinach", calories: 41, protein: 5, carbs: 3, fat: 0.5, servingLabel: "1 cup (180g)", mealType: "dinner" },
      { name: "Almonds", calories: 164, protein: 6, carbs: 6, fat: 14, servingLabel: "28g", mealType: "snacks" },
      { name: "Banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, servingLabel: "1 medium", mealType: "snacks" },
    ],
    gain: [
      { name: "Whole Eggs (3) + Sweet Potato", calories: 328, protein: 21, carbs: 27, fat: 14, servingLabel: "1 large breakfast", mealType: "breakfast" },
      { name: "Coconut Milk Smoothie", calories: 200, protein: 2, carbs: 20, fat: 13, servingLabel: "1 glass", mealType: "breakfast" },
      { name: "Grass-Fed Beef Steak", calories: 300, protein: 32, carbs: 0, fat: 19, servingLabel: "130 g", mealType: "lunch" },
      { name: "Roasted Sweet Potato", calories: 180, protein: 3, carbs: 42, fat: 0.2, servingLabel: "1 large", mealType: "lunch" },
      { name: "Avocado", calories: 240, protein: 3, carbs: 12, fat: 22, servingLabel: "1 fruit", mealType: "lunch" },
      { name: "Salmon (large portion)", calories: 416, protein: 44, carbs: 0, fat: 26, servingLabel: "200 g", mealType: "dinner" },
      { name: "Roasted Vegetables + Olive Oil", calories: 150, protein: 3, carbs: 20, fat: 8, servingLabel: "1.5 cups", mealType: "dinner" },
      { name: "Mixed Nuts", calories: 200, protein: 5, carbs: 8, fat: 18, servingLabel: "40g", mealType: "snacks" },
      { name: "Dates", calories: 120, protein: 1, carbs: 32, fat: 0, servingLabel: "4 dates", mealType: "snacks" },
    ],
  },
  mediterranean: {
    lose: [
      { name: "Greek Yogurt + Honey", calories: 130, protein: 17, carbs: 12, fat: 0.7, servingLabel: "170g yogurt + 1 tsp honey", mealType: "breakfast" },
      { name: "Berries (mixed)", calories: 70, protein: 1, carbs: 16, fat: 0.5, servingLabel: "1 cup", mealType: "breakfast" },
      { name: "Grilled Fish (sea bass)", calories: 180, protein: 28, carbs: 0, fat: 7, servingLabel: "130 g", mealType: "lunch" },
      { name: "Greek Salad", calories: 120, protein: 4, carbs: 8, fat: 9, servingLabel: "1 large bowl", mealType: "lunch" },
      { name: "Baked Salmon", calories: 208, protein: 22, carbs: 0, fat: 13, servingLabel: "100 g", mealType: "dinner" },
      { name: "Roasted Vegetables + Olive Oil", calories: 130, protein: 3, carbs: 20, fat: 6, servingLabel: "1.5 cups", mealType: "dinner" },
      { name: "Hummus + Veggies", calories: 110, protein: 5, carbs: 12, fat: 5, servingLabel: "3 tbsp hummus + veggies", mealType: "snacks" },
      { name: "Walnuts", calories: 92, protein: 2.2, carbs: 1.9, fat: 9.2, servingLabel: "14g", mealType: "snacks" },
    ],
    maintain: [
      { name: "Whole Grain Toast + Avocado", calories: 200, protein: 5, carbs: 22, fat: 12, servingLabel: "1 slice + ½ avocado", mealType: "breakfast" },
      { name: "Poached Eggs (2)", calories: 144, protein: 12.6, carbs: 0.8, fat: 9.6, servingLabel: "2 large eggs", mealType: "breakfast" },
      { name: "Grilled Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, servingLabel: "100 g", mealType: "lunch" },
      { name: "Quinoa (cooked)", calories: 222, protein: 8, carbs: 39, fat: 3.5, servingLabel: "1 cup", mealType: "lunch" },
      { name: "Roasted Bell Peppers + Feta", calories: 100, protein: 5, carbs: 10, fat: 5, servingLabel: "1 serving", mealType: "lunch" },
      { name: "Salmon with Lemon + Herbs", calories: 208, protein: 22, carbs: 0, fat: 13, servingLabel: "100 g", mealType: "dinner" },
      { name: "Whole Grain Pasta (olive oil)", calories: 250, protein: 9, carbs: 48, fat: 5, servingLabel: "1 cup", mealType: "dinner" },
      { name: "Olives", calories: 59, protein: 0.4, carbs: 3, fat: 6, servingLabel: "30g (10 olives)", mealType: "snacks" },
      { name: "Almonds", calories: 82, protein: 3, carbs: 3, fat: 7, servingLabel: "14g", mealType: "snacks" },
    ],
    gain: [
      { name: "Whole Grain Breakfast Bowl", calories: 400, protein: 18, carbs: 55, fat: 14, servingLabel: "1 large bowl", mealType: "breakfast" },
      { name: "Fresh Orange Juice", calories: 112, protein: 1.7, carbs: 26, fat: 0.5, servingLabel: "1 cup", mealType: "breakfast" },
      { name: "Grilled Sea Bass (large)", calories: 280, protein: 44, carbs: 0, fat: 11, servingLabel: "200 g", mealType: "lunch" },
      { name: "Hummus + Whole Grain Pita", calories: 280, protein: 10, carbs: 42, fat: 8, servingLabel: "4 tbsp hummus + 1 pita", mealType: "lunch" },
      { name: "Greek Salad (full)", calories: 200, protein: 6, carbs: 12, fat: 15, servingLabel: "1 large serving", mealType: "lunch" },
      { name: "Baked Salmon (large)", calories: 416, protein: 44, carbs: 0, fat: 26, servingLabel: "200 g", mealType: "dinner" },
      { name: "Whole Grain Pasta + Olive Oil", calories: 380, protein: 13, carbs: 65, fat: 10, servingLabel: "1.5 cups cooked", mealType: "dinner" },
      { name: "Mixed Nuts", calories: 200, protein: 5, carbs: 8, fat: 18, servingLabel: "40g", mealType: "snacks" },
      { name: "Greek Yogurt + Granola", calories: 250, protein: 18, carbs: 30, fat: 6, servingLabel: "170g yogurt + 40g granola", mealType: "snacks" },
    ],
  },
  high_protein: {
    lose: [
      { name: "Egg White Omelette (5 whites)", calories: 85, protein: 18, carbs: 1.5, fat: 0.5, servingLabel: "5 egg whites", mealType: "breakfast" },
      { name: "Greek Yogurt (plain)", calories: 100, protein: 17, carbs: 6, fat: 0.7, servingLabel: "170 g", mealType: "breakfast" },
      { name: "Grilled Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, servingLabel: "100 g", mealType: "lunch" },
      { name: "Tuna (in water)", calories: 100, protein: 22, carbs: 0, fat: 0.5, servingLabel: "1 can (140g)", mealType: "lunch" },
      { name: "Steamed Broccoli", calories: 55, protein: 3.7, carbs: 11, fat: 0.6, servingLabel: "1 cup", mealType: "lunch" },
      { name: "Salmon (baked)", calories: 208, protein: 22, carbs: 0, fat: 13, servingLabel: "100 g", mealType: "dinner" },
      { name: "Asparagus (steamed)", calories: 40, protein: 4, carbs: 7, fat: 0.4, servingLabel: "1 cup", mealType: "dinner" },
      { name: "Whey Protein Shake", calories: 130, protein: 25, carbs: 5, fat: 2, servingLabel: "1 scoop (30g)", mealType: "snacks" },
      { name: "Almonds", calories: 82, protein: 3, carbs: 3, fat: 7, servingLabel: "14g", mealType: "snacks" },
    ],
    maintain: [
      { name: "Whey Protein Shake + Oats", calories: 330, protein: 30, carbs: 40, fat: 5, servingLabel: "1 scoop + 1 cup oats", mealType: "breakfast" },
      { name: "Whole Eggs (2)", calories: 144, protein: 12.6, carbs: 0.8, fat: 9.6, servingLabel: "2 large eggs", mealType: "breakfast" },
      { name: "Grilled Chicken Breast (large)", calories: 248, protein: 46, carbs: 0, fat: 5.4, servingLabel: "150 g", mealType: "lunch" },
      { name: "Brown Rice (cooked)", calories: 200, protein: 4, carbs: 42, fat: 1.5, servingLabel: "1 cup", mealType: "lunch" },
      { name: "Baked Cod", calories: 180, protein: 38, carbs: 0, fat: 1.5, servingLabel: "150 g", mealType: "dinner" },
      { name: "Sweet Potato", calories: 112, protein: 2, carbs: 26, fat: 0.1, servingLabel: "1 medium", mealType: "dinner" },
      { name: "Greek Yogurt + Berries", calories: 170, protein: 17, carbs: 22, fat: 0.7, servingLabel: "1 serving", mealType: "snacks" },
      { name: "Cottage Cheese (low-fat)", calories: 80, protein: 14, carbs: 3, fat: 1, servingLabel: "½ cup (113g)", mealType: "snacks" },
    ],
    gain: [
      { name: "Whole Eggs (4) + Whites (3)", calories: 375, protein: 36, carbs: 2, fat: 24, servingLabel: "1 large breakfast", mealType: "breakfast" },
      { name: "Whey Protein Shake", calories: 130, protein: 25, carbs: 5, fat: 2, servingLabel: "1 scoop", mealType: "breakfast" },
      { name: "Oatmeal (cooked)", calories: 300, protein: 10, carbs: 54, fat: 5, servingLabel: "2 cups", mealType: "breakfast" },
      { name: "Chicken Breast (double)", calories: 330, protein: 62, carbs: 0, fat: 7.2, servingLabel: "200 g", mealType: "lunch" },
      { name: "White Rice (cooked)", calories: 412, protein: 8.6, carbs: 90, fat: 0.8, servingLabel: "2 cups", mealType: "lunch" },
      { name: "Ground Turkey (lean)", calories: 200, protein: 28, carbs: 0, fat: 9, servingLabel: "100 g", mealType: "dinner" },
      { name: "Pasta (cooked)", calories: 220, protein: 8, carbs: 43, fat: 1.3, servingLabel: "1 cup", mealType: "dinner" },
      { name: "Whey Protein Shake", calories: 130, protein: 25, carbs: 5, fat: 2, servingLabel: "1 scoop", mealType: "snacks" },
      { name: "Cottage Cheese (full-fat)", calories: 220, protein: 25, carbs: 6, fat: 10, servingLabel: "1 cup", mealType: "snacks" },
    ],
  },
};

const GOAL_LABEL: Record<Goal, string> = {
  lose: "Lose Weight",
  maintain: "Maintain",
  gain: "Gain Muscle",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AutoMealPlanModal({ open, onClose }: Props) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

  const [dietType, setDietType] = useState<DietType>("standard");
  const [dietOpen, setDietOpen] = useState(false);
  const [done, setDone] = useState(false);

  const settings = readEnergySettings();
  const goal = settings.goal;
  const targetCals = calculateTarget(settings);

  const plan = PLANS[dietType][goal];
  const planCals = plan.reduce((sum, item) => sum + item.calories, 0);
  const planProtein = plan.reduce((sum, item) => sum + item.protein, 0);
  const planCarbs = plan.reduce((sum, item) => sum + item.carbs, 0);
  const planFat = plan.reduce((sum, item) => sum + item.fat, 0);

  const scaleFactor = planCals > 0 ? targetCals / planCals : 1;

  const mealsByType: Record<MealType, MealItem[]> = {
    breakfast: plan.filter((i) => i.mealType === "breakfast"),
    lunch: plan.filter((i) => i.mealType === "lunch"),
    dinner: plan.filter((i) => i.mealType === "dinner"),
    snacks: plan.filter((i) => i.mealType === "snacks"),
  };

  const MEAL_LABELS: Record<MealType, string> = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snacks: "Snacks",
  };

  const handleGenerate = () => {
    for (const item of plan) {
      addEntry({
        name: item.name,
        calories: Math.round(item.calories * scaleFactor),
        protein: +(item.protein * scaleFactor).toFixed(1),
        carbs: +(item.carbs * scaleFactor).toFixed(1),
        fat: +(item.fat * scaleFactor).toFixed(1),
        quantity: 1,
        servingLabel: item.servingLabel,
        mealType: item.mealType,
      });
    }
    setDone(true);
    setTimeout(() => {
      setDone(false);
      onClose();
    }, 1400);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-w-md rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: colors.surface ?? "#0a0f1e", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 pb-3"
          style={{ borderBottom: `1px solid ${colors.surfaceBorder}` }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: colors.primary }} />
            <div>
              <p className="font-bold text-sm" style={{ color: colors.text }}>Auto-Fill Meal Plan</p>
              <p className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                Goal: {GOAL_LABEL[goal]} · {targetCals} kcal target
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
            <X size={16} style={{ color: colors.textMuted }} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Diet type selector */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: colors.textMuted }}>
              Diet Type
            </p>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDietOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold"
                style={{
                  backgroundColor: `${colors.primary}15`,
                  border: `1px solid ${colors.primary}40`,
                  color: colors.text,
                }}
                data-testid="select-diet-type"
              >
                {DIET_LABELS[dietType]}
                <ChevronDown size={16} style={{ color: colors.textMuted, transform: dietOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              <AnimatePresence>
                {dietOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 right-0 rounded-xl z-10 mt-1 overflow-hidden"
                    style={{ backgroundColor: colors.surface ?? "#0a0f1e", border: `1px solid ${colors.surfaceBorder}`, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                  >
                    {(Object.keys(DIET_LABELS) as DietType[]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => { setDietType(d); setDietOpen(false); }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors"
                        style={{
                          backgroundColor: d === dietType ? `${colors.primary}15` : "transparent",
                          color: d === dietType ? colors.primary : colors.text,
                        }}
                        data-testid={`option-diet-${d}`}
                      >
                        {DIET_LABELS[d]}
                        {d === dietType && <Check size={14} style={{ color: colors.primary }} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Macro preview */}
          <div
            className="rounded-xl p-4 grid grid-cols-4 gap-2"
            style={{ backgroundColor: `${colors.primary}08`, border: `1px solid ${colors.primary}20` }}
          >
            {[
              { label: "Calories", value: Math.round(planCals * scaleFactor), unit: "kcal" },
              { label: "Protein", value: Math.round(planProtein * scaleFactor), unit: "g" },
              { label: "Carbs", value: Math.round(planCarbs * scaleFactor), unit: "g" },
              { label: "Fat", value: Math.round(planFat * scaleFactor), unit: "g" },
            ].map(({ label, value, unit }) => (
              <div key={label} className="text-center">
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: colors.textMuted }}>{label}</p>
                <p className="text-sm font-bold" style={{ color: colors.primary }}>
                  {value}<span className="text-[10px] font-normal" style={{ color: colors.textMuted }}>{unit}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Meal preview */}
          <div className="space-y-3">
            {(["breakfast", "lunch", "dinner", "snacks"] as MealType[]).map((mt) => (
              <div key={mt}>
                <p className="text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: colors.textMuted }}>
                  {MEAL_LABELS[mt]}
                </p>
                <div className="space-y-1">
                  {mealsByType[mt].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium truncate" style={{ color: colors.text }}>{item.name}</p>
                        <p className="text-[10px]" style={{ color: colors.textMuted }}>{item.servingLabel}</p>
                      </div>
                      <p className="text-[11px] font-bold ml-2 shrink-0" style={{ color: colors.primary }}>
                        {Math.round(item.calories * scaleFactor)} kcal
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="pb-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={done}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{ backgroundColor: done ? "#22c55e" : colors.primary, color: "#fff" }}
              data-testid="button-generate-plan"
            >
              {done ? (
                <>
                  <Check size={16} />
                  Added to Today's Log!
                </>
              ) : (
                <>
                  <Utensils size={16} />
                  Add to Today's Log
                </>
              )}
            </button>
            <p className="text-[10px] text-center mt-2" style={{ color: colors.textMuted }}>
              Portions scaled to your {targetCals} kcal target
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
