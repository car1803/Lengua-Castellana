document.addEventListener("DOMContentLoaded", function () {
    const authors = document.querySelectorAll('.author');
    const tooltip = document.getElementById('tooltip');
    authors.forEach(author => {
        author.addEventListener('mouseenter', function (event) {
            const authorName = this.getAttribute('data-name');
            const rect = this.getBoundingClientRect();
            tooltip.style.display = 'block';
            tooltip.innerHTML = authorName;
            tooltip.style.left = (rect.right + 10) + 'px';
            tooltip.style.top = (rect.top + window.scrollY) + 'px';
        });
        author.addEventListener('mouseleave', function () {
            tooltip.style.display = 'none';
        });
        author.addEventListener('click', function () {
            const authorLink = this.getAttribute('data-link');
            window.location.href = authorLink;
        });
    });
    document.addEventListener('mousemove', function (event) {
        tooltip.style.left = (event.clientX + 10) + 'px';
        tooltip.style.top = (event.clientY + window.scrollY) + 'px';
    });
});

function redirectTo(page) {
    window.location.href = page;
}