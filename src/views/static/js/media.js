const openMediaPage = async (contentId, source, media_type) => {
  try {
    const response = await fetch("/p/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId, source, media_type }),
    });

    if (response.ok) {
      const { redirectUrl } = await response.json();
      window.location.href = redirectUrl;
    } else {
      const { error } = await response.json();
      console.error("Error:", error);
    }
  } catch (error) {
    console.error("Error in openMediaPage:", error.message);
  }
};
