console.log("CMS FILE LOADED");

(async () => {
    try {
        const response = await fetch('./data/timeline.json');

        console.log("STATUS:", response.status);

        const data = await response.json();

        console.log("TIMELINE DATA:");
        console.log(data);

    } catch (error) {
        console.error("CMS TEST FAILED:", error);
    }
})();