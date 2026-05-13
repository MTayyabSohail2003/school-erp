const { z } = require('zod');

const schema = z.object({ email: z.string().email() });

try {
    schema.parse({ email: " test@example.com " });
    console.log("Passed with spaces");
} catch (e) {
    console.error("Failed with spaces");
}

try {
    schema.parse({ email: "Test@Example.com" });
    console.log("Passed uppercase");
} catch (e) {
    console.error("Failed uppercase");
}
