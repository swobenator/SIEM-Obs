export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries = 5
): Promise<T> {
    let delay = 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }

            console.error(
                `Operation failed. Retrying in ${delay}ms...`
            );

            await new Promise(resolve => setTimeout(resolve, delay));

            delay *= 2;
        }
    }

    throw new Error("Retry operation failed");
}