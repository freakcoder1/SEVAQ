// Test parsing of totalAmount from backend response
const testResponses = [
    { totalAmount: "1500.00" },  // String from test
    { totalAmount: 1500.00 },   // Number
    { totalAmount: "1000.00" },  // String
    { amount: 2000 },           // Using amount field
    {}
];

testResponses.forEach((response, index) => {
    console.log(`\nTest ${index + 1}:`, JSON.stringify(response));
    
    let parsedAmount;
    if (response.amount != null) {
        parsedAmount = typeof response.amount === 'string' 
            ? parseFloat(response.amount) 
            : Number(response.amount);
    } else if (response.totalAmount != null) {
        parsedAmount = typeof response.totalAmount === 'string' 
            ? parseFloat(response.totalAmount) 
            : Number(response.totalAmount);
    } else {
        parsedAmount = 0.0;
    }
    
    console.log(`Parsed amount: ${parsedAmount} (Type: ${typeof parsedAmount})`);
});
