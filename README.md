## js template模版渲染


## 快速上手

### 编写模版

```html
<% if (names.length)  %>
<ul>
    <% names.forEach(function(name){ %>
    <li><%= name %></li>
    <% }) %>
</ul>
<% endif %>
```

### 渲染模板
```js
const el = document.querySelector('#template')
const obj = {
    names: (new Array(1)).fill('wjun94')
}
console.log(tjs(el.innerHTML, obj))
```

输出结果

```html
<div>
    <ul>
        <li>wjun94</li>
    </ul>
</div>
```