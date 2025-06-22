// Handle notification close buttons
document.addEventListener("DOMContentLoaded", function () {
  // Close notifications
  const deleteButtons = document.querySelectorAll(".notification .delete");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", function () {
      this.parentElement.style.display = "none";
    });
  });

  // Add mobile menu toggle functionality if needed
  const navbarBurgers = document.querySelectorAll(".navbar-burger");
  navbarBurgers.forEach((burger) => {
    burger.addEventListener("click", function () {
      const target = document.getElementById(burger.dataset.target);
      burger.classList.toggle("is-active");
      target.classList.toggle("is-active");
    });
  });
});
