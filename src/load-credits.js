// load-credits.js
document.addEventListener("DOMContentLoaded", async () => {
  const attributionsContainer = document.getElementById("attributions");
  if (!attributionsContainer) return;

  try {
    const response = await fetch("src/credits.json");
    if (!response.ok) throw new Error("Failed to load credits.json");
    const credits = await response.json();

    // Clear placeholder
    attributionsContainer.innerHTML = "";

    const shortenLicense = (license) => {
      if (!license.includes("Creative Commons")) return license;

      if (license.includes("Attribution") && license.includes("Share Alike")) {
        const match = license.match(/(\d+\.\d+(?:\s+\w+)*)/);
        if (match) {
          return `CC BY-SA ${match[1].trim()}`;
        }
        return "CC BY-SA";
      }
      return license;
    }

    const addLink = (entry) => {
      const a = document.createElement("a");
      a.href = entry.page;
      a.target = "_blank";
      a.rel = "noreferrer";

      if (entry.license === "Flaticon License") {
        const name = entry.title.replace(".svg", "").replace(/-/g, " ").replace(/_/g, " ").trim();
        const cleanName = name.charAt(0).toUpperCase() + name.slice(1);
        a.textContent = `${cleanName} icons created by ${entry.author} - Flaticon`;
        a.title = `${cleanName} icons`;
      } else if (entry.page.includes("wikimedia")) {
        a.textContent = `File:${entry.title} by ${entry.author}, ${shortenLicense(entry.license)}`;
        a.title = entry.description || entry.title;
      } else {
        a.textContent = `${entry.title} – ${entry.author} – ${shortenLicense(entry.license)}`;
      }

      const br = document.createElement("br");
      attributionsContainer.appendChild(a);
      attributionsContainer.appendChild(br);
    };

    // Order: Flaticon → Wikimedia → Others
    const flaticon = credits.filter(c => c.license === "Flaticon License");
    const wikimedia = credits.filter(c => c.page.includes("wikimedia"));
    const others = credits.filter(c => !c.license.includes("Flaticon") && !c.page.includes("wikimedia"));

    [...flaticon, ...wikimedia, ...others].forEach(addLink);

  } catch (err) {
    console.error("Failed to load credits:", err);
    attributionsContainer.innerHTML = "<em>Failed to load attributions.</em><br>";
  }
});