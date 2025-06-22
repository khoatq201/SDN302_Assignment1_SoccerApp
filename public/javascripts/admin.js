document.addEventListener("DOMContentLoaded", function () {
  // Mobile sidebar toggle
  const sidebarToggle = document.querySelector(".admin-sidebar-toggle");
  const sidebar = document.querySelector(".admin-sidebar");

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", function () {
      sidebar.classList.toggle("is-active");
    });
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener("click", function (e) {
    if (window.innerWidth <= 1023) {
      if (
        sidebar &&
        !sidebar.contains(e.target) &&
        !sidebarToggle.contains(e.target)
      ) {
        sidebar.classList.remove("is-active");
      }
    }
  });

  // Auto-hide notifications
  const notifications = document.querySelectorAll(".notification");
  notifications.forEach((notification) => {
    // Auto hide after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);

    // Delete button functionality
    const deleteBtn = notification.querySelector(".delete");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        notification.remove();
      });
    }
  });
});
