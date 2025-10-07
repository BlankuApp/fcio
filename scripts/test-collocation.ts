/**
 * Test script for collocation generator
 * Run with: npx tsx scripts/test-collocation.ts
 */

// Load environment variables from .env.local
import dotenv from "dotenv";
import path from "path";

// Load .env.local file
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { generateCollocations } from "../src/lib/ai/collocation-generator";

async function testCollocationGenerator() {
  console.log("🧪 Testing Collocation Generator...\n");

  try {
    // // Test 1: English word
    // console.log('Test 1: English word "happy"');
    // console.log("-----------------------------------");
    // const result1 = await generateCollocations("happy", "English");
    // console.log("Result:", result1);
    // console.log("\n");

    // Test 2: English word
    console.log('Test 2: English word "policy"');
    console.log("-----------------------------------");
    const result2 = await generateCollocations("policy", "English");
    console.log("Result:", result2);
    console.log("\n");

    // Test 3: Japanese word
    console.log('Test 3: Japanese word "食べる"');
    console.log("-----------------------------------");
    const result3 = await generateCollocations("食べる", "Japanese");
    console.log("Result:", result3);
    console.log("\n");

    // // Test 4: Spanish word
    // console.log('Test 4: Spanish word "amor"')
    // console.log('-----------------------------------')
    // const result4 = await generateCollocations('amor', 'Spanish')
    // console.log('Result:', result4)
    // console.log('\n')

    // Test 5: Japanese word
    console.log('Test 5: Japanese word "基本"');
    console.log("-----------------------------------");
    const result5 = await generateCollocations("基本", "Japanese");
    console.log("Result:", result5);
    console.log("\n");

    // Test 6: Japanese word
    console.log('Test 6: Japanese word "詰める"');
    console.log("-----------------------------------");
    const result6 = await generateCollocations("詰める", "Japanese");
    console.log("Result:", result6);
    console.log("\n");

    console.log("✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Error during testing:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testCollocationGenerator();
