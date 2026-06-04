console.log("CMS FILE LOADED");

(async () => {
  try {
    console.log("START FETCH");

    const response = await fetch('./data/timeline.json');

    console.log("STATUS:", response.status);

    const data = await response.json();

    console.log("TIMELINE DATA:", data);

    document.body.insertAdjacentHTML(
      "afterbegin",
      "<div style='position:fixed;top:0;left:0;background:red;color:white;padding:10px;z-index:99999'>JSON LOADED</div>"
    );

  } catch (error) {
    console.error("CMS TEST FAILED:", error);
  }
})();