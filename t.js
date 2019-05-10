(function (global, factory) {
    global.tjs = factory()
})(this, function () {
    const options = {
        statement: /(if|forEach|endif)([\s\S]+)/,
        stag: /(<%=|<%)/,
    }
    // 抽象语法树
    const astNode = []
    // 保存状态,记录父节点
    const parentNode = []

    function tjs(el, options = null) {
        if (el) {
            const vnode = tjs.parse(el)
            this.render = tjs.render = tjs.compile(vnode)
            if (options) {
                return tjs.render(options)
            }
        }
    }

    /** 
     * 生成ast抽象语法树
     * @param {String} str 字符串
     * @param {Array|null} arr children节点
     * @return {Array}
     */
    tjs.prototype.parse = tjs.parse = function (str, arr = null) {
        str = str.trim()
        const matches = str.match(options.stag)
        const root = arr || astNode
        if (matches) {
            const {
                index
            } = matches
            let value = null;
            const eTag = str.indexOf('%>')
            if (index !== 0) {
                root.push(createTextShape(str.slice(0, index)))
            }
            switch (matches[0]) {
                case '<%=':
                    root.push(createLabelShape(str.slice(index + 3, eTag)))
                    tjs.parse(str.slice(eTag + 2), root)
                    break
                case '<%':
                    const statement = str.slice(index + 2, eTag)
                    value = statement.match(options.statement)
                    if (value) {
                        const tag = value[1] === 'endif' ? createTextShape('}') : createTagShape(value[1], statement, root)
                        root.push(tag)
                        if (value[1] === 'endif') {
                            tjs.parse(str.slice(eTag + 2), parentNode.pop())
                        } else {
                            if (value[1] === 'if') parentNode.push(root);
                            tjs.parse(str.slice(eTag + 2), value[1] === 'if' ? tag.children : root)
                        }
                    } else {
                        root.push(createTextShape(statement))
                        tjs.parse(str.slice(eTag + 2), root)
                    }
                    break
            }
        } else {
            astNode.push(createTextShape(str))
        }
        return root
    }

    /** 
     * 生成函数
     * @param {Array} vnode 虚拟节点
     * @return {Function}
     */
    tjs.prototype.compile = tjs.compile = function (vnode) {
        const code = "var _str = '';" + (function jump(data) {
            let domStr = ''
            data.forEach(v => {
                const {
                    value,
                    type,
                    tag,
                    expression,
                    children
                } = v
                switch (type) {
                    case 1:
                        if (value === '})' || value === '}') {
                            domStr += value + ';'
                        } else {
                            domStr += "_str += '" + value + "';\n"
                        }
                        break;
                    case 2:
                        domStr += expression + (tag === 'if' ? '{' : '') + jump(children)
                        break;
                    case 3:
                        domStr += "_str += " + value + ";\n"
                        break;
                }
            })

            return domStr
        })(vnode)
        const buf = "with(__obj__ || {}) {" + code + "return _str;}"
        return new Function('__obj__', buf)
    }

    /**
     * 标签节点模型
     * @param {*} value 值
     */
    function createTextShape(value) {
        return {
            type: 1,
            value: value.replace(/\n/g, " ").trim()
        }
    }

    /**
     * 表达式节点模型
     * @param {if | forEach} tag 
     * @param {String} expression 
     */
    function createTagShape(tag, expression) {
        return {
            type: 2,
            tag: tag.replace(/\n/g, " ").trim(),
            expression,
            children: [],
        }
    }

    /**
     * 赋值节点模型
     * @param {*} value 值
     */
    function createLabelShape(value) {
        return {
            type: 3,
            value: value.replace(/\n/g, " ").trim()
        }
    }

    return tjs
})
