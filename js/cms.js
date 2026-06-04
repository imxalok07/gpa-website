(async () => {
    try {
        const response = await fetch(GPA_CONFIG.timelineCsvUrl);

        console.log("STATUS:", response.status);

        const text = await response.text();

        console.log("CSV DATA:");
        console.log(text);

    } catch (error) {
        console.error("CMS TEST FAILED:", error);
    }
})();