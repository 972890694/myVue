class Watcher {
    constructor(vm, expr, cb) {
        this.vm = vm
        this.expr = expr
        this.cb = cb

        Dep.target = this;

        this.oldValue = this.getVMValue(vm, expr)

        Dep.target = null;
    }

    update() {
        let oldValue = this.oldValue
        let newValue = this.getVMValue(this.vm, this.expr)
        if (oldValue != this.newValue) {
            this.cb(newValue)
        }
    }

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
        if (expr.includes('[')) {
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
    }
}

/* dep对象用于管理所有的订阅者和通知这些订阅者 */
class Dep {
    constructor() {
        this.subs = []
    }

    // 添加订阅者
    addSub(watcher) {
        this.subs.push(watcher);
    }

    // 发布通知
    notify() {
        this.subs.forEach(sub => {
            sub.update();
        })
    }
}