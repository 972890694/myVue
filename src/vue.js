// ES6 语法，定义一个类， 相当于构造函数
class Vue {
    constructor(options = {}) {
        this.$el = options.el
        this.$data = options.data
        this.$methods = options.methods

        // 监视data中的数据
        new Observer(this.$data)

        // 将data和methods代理到vue中
        this.proxy(options.data);
        this.proxy(options.methods);

        // compile负责解析模板的内容
        // 需要：模板和数据
        if (this.$el) {
            new Complier(this.$el, this)
        }
    }
    proxy(data) {
        Object.keys(data).forEach(key => {
            Object.defineProperty(this, key, {
                configurable: false, // 能否第二次配置
                enumerable: true,  // 能否遍历

                get() {
                    return data[key];
                },
                set(val) {
                    if (data[key] === val) return;
                    data[key] = val;
                },
            })
        })
    }

}