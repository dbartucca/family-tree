document.querySelectorAll('.person').forEach(person => {
    person.addEventListener('click', () => {
        const children = person.querySelector('.children');
        if (children) {
            children.style.display = children.style.display === 'none' ? 'flex' : 'none';
        }
    });
});
