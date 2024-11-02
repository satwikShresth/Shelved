// Event listener for form submission
document.getElementById('searchForm').addEventListener('submit', async function(event) {
  event.preventDefault(); // Prevent form's default submission behavior

  const query = document.getElementById('searchInput').value; // Extract query from input field

  try {
    // Fetch search results from the backend API
    const response = await fetch(`/api/search?query=${query}`);
    const results = await response.json();

    // Get reference to the results container and clear previous results
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';

    // Iterate over the results and create a card for each item
    results.forEach(item => {
      const card = document.createElement('div');
      card.className = 'result-card';
      card.innerHTML = `
        <img src="${item.poster}" alt="${item.name}" />
        <h3>${item.name}</h3>
        <p>${item.author}</p>
      `;
      resultsContainer.appendChild(card); // Append card to the container
    });
  } catch (error) {
    console.error('Error fetching search results:', error); // Log any errors
  }
});
