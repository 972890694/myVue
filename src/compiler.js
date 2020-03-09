/**
 * 专门负责解析模板内容
 */
class Complier {
    constructor(el, vm) {
        // el： 选择器或者是 DOM 对象
        this.el = typeof el === 'string' ? document.querySelector(el) : el;
        // vm： vm 实例
        this.vm = vm;

        // 编译模板
        if (this.el) {
            //1. 把el中所有的子节点都放入到内存中， fragment
            let fragment = this.node2fragment(this.el);
            //2. 在内存中编译fragment
            this.compile(fragment);
            //3. 把fragment一次性的添加到页面
            this.el.appendChild(fragment)
        }
    }

    /* 核心方法 */
    node2fragment(node) {
        let fragment = document.createDocumentFragment()
        // 把el中所有的子节点挨个添加到文档碎片中
        let childNodes = node.childNodes
        Complier.toArray(childNodes).forEach(node => {
            // 把所有的子节点都添加到frament中
            fragment.appendChild(node)
        })
        return fragment;
    }
    /**
    * 编译文档碎片（内存中）
    * @param {*} fragment
    */
    compile(fragment) {
        let childNodes = fragment.childNodes;
        Complier.toArray(childNodes).forEach(node => {
            // 如果是元素节点
            if (Complier.isElementNode(node)) {
                // 如果是元素， 需要解析指令
                this.compileElement(node)
            }
            // 如果是文本节点
            if (Complier.isTextNode(node)) {
                // 如果是文本节点， 需要解析插值表达式
                this.compileText(node)
            }
            // 如果节点还有子节点
            if (node.childNodes && node.childNodes.length > 0) {
                this.compile(node)
            }
        })
    }
    /* 编译元素节点 */
    compileElement(node) {
        let attributes = node.attributes;
        Complier.toArray(attributes).forEach(attr => {
            let attrName = attr.name;
            /* 解析指令 判断是不是以 v- 开头 */
            if (Complier.isDirective(attrName)) {
                let type = attrName.substr(2);
                let expr = attr.value;
                /**判断是不是以 v-on 开头 */
                if (Complier.isEventDirective(type)) {
                    ComplierUtil.eventHandler(node, this.vm, expr, type);
                } else {
                    ComplierUtil.getVMValue(this.vm, expr)
                    ComplierUtil[type] && ComplierUtil[type](node, this.vm, expr);
                }
                //  是不是以 @ 开头
            } else if (Complier.isDirectiveAt(attrName)) {
                let type = attrName.substr(1);
                let expr = attr.value;
                ComplierUtil.eventHandler(node, this.vm, expr, type);
            }
        })
    }
    /* 编译文本节点 */
    compileText(node) {
        ComplierUtil.mustache(node, this.vm);
    }

    /* 工具方法 */
    static toArray(likeArray) {
        return [].slice.call(likeArray);
    }
    static isElementNode(node) {
        return node.nodeType === 1;
    }
    static isTextNode(node) {
        return node.nodeType === 3;
    }
    // 判断是不是以 v- 开头的属性
    static isDirective(attrName) {
        return attrName.startsWith("v-") // ES6 方法判断以..开头
    }
    // 判断是不是以 @ 开头的属性
    static isDirectiveAt(attrName) {
        return attrName.startsWith("@") // ES6 方法判断以..开头
    }
    static isEventDirective(type) {
        return type.split(':')[0] == 'on'
    }
}

let ComplierUtil = {
    // 胡子语法的方法
    mustache(node, vm) {
        let txt = node.textContent;
        let reg = /\{\{(.+)\}\}/;
        if (reg.test(txt)) {
            // 用字符串的方法
            // let str = txt.split('{{')[1];
            // let expr = str.split('}}')[0].replace(/\s+/g, "");
            // 利用正则分组的方法的取值
            let expr = RegExp.$1.replace(/\s+/g, "");
            node.textContent = txt.replace(reg, this.getVMValue(vm, expr));
            new Watcher(vm, expr, newValue => {
                node.textContent = newValue;
            })
        }
    },
    text(node, vm, expr) {
        // debugger
        node.innerText = this.getVMValue(vm, expr);
        new Watcher(vm, expr, newValue => {
            node.innerText = newValue;
        })
    },
    html(node, vm, expr) {
        node.innerHTML = this.getVMValue(vm, expr);
        new Watcher(vm, expr, newValue => {
            node.innerHTML = newValue;
        })
    },
    model(node, vm, expr) {
        let that = this;
        node.value = this.getVMValue(vm, expr);
        node.addEventListener('input', function () {
            that.setVMValue(vm, expr, this.value)
        })
        new Watcher(vm, expr, newValue => {
            node.value = newValue;
        })
    },
    eventHandler(node, vm, expr, type) {
        // 如果是以 @ 开头的 不用分割字符串， 直接拿 type
        let eventType = type.split(':')[1] || type;
        let fn = vm.$methods && vm.$methods[expr];
        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm))
        } else {
            console.error(`methods中没有定义${expr}这个方法`);
        }

    },
    getVMValue(vm, expr) {
        let data = vm.$data;
        let boolean = false;
        // debugger
        // 对象的处理方法
        //Todo 没做错误处理
        if (expr.includes('.')) {
            boolean = true;
            expr.split('.').forEach(key => {
                data = data[key];
            })
        }
        // 数组的处理方法
        //Todo 没做错误处理
        if (expr.includes('[') && expr.includes(']')) {
            boolean = true;
            let str = expr.split('[')[0];
            data[str].some(item => {
                let aaa = expr.split('[')[1].split(']')[0];
                return data = data[str][aaa];
            })
        }
        if (boolean) {
            // 如果是复杂数据类型改变
            return data;
        }
        // 简单数据类型返回data中的数据
        return data[expr];
    },
    setVMValue(vm, expr, value) {
        // debugger
        let data = vm.$data;
        if (expr.includes('.')) {
            let arr = expr.split('.');
            arr.forEach((key, index) => {
                if (index != arr.length - 1) {
                    data = data[key]
                } else {
                    data[key] = value;
                }
            })
        } else {
            data[expr] = value
        }

    }
}