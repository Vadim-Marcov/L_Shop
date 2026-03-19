export const catalogHTML = `
    <div class="catalog-header">
        <h2>Каталог товаров</h2>
    </div>
    
    <div class="filters">
        <input type="text" id="search-input" placeholder="Поиск по названию или описанию...">
        
        <select id="category-filter">
            <option value="all">Все категории</option>
            <option value="одежда">Одежда</option>
            <option value="аксессуары">Аксессуары</option>
        </select>

        <select id="sort-price">
            <option value="default">Сортировка</option>
            <option value="low">Сначала дешевые</option>
            <option value="high">Сначала дорогие</option>
        </select>

        <label class="filter-stock">
            <input type="checkbox" id="stock-filter"> 
            <span>В наличии</span>
        </label>
    </div>

    <div class="product-grid" id="products-container">
        <p>Загрузка товаров...</p>
    </div>
`;