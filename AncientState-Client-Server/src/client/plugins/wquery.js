const sqData = new Map();

const sq = {
	default: function (q) {
		const type = typeof(q);
		if (type === 'string') {
			if (q[0] === '<')
				return this.build(q);
			return sq.find(q);
		} else if (type === 'object')
			return sq.wrap([q]);

		document.addEventListener('DOMContentLoaded', q, false);
	},

	build: function (tpl) {
		let el = document.createElement('template');
		el.innerHTML = tpl.trim();
		return sq.wrap([el.content.firstChild]);
	},

	find: function (queryString) {
		if (!this[0])
			return sq.wrap(document.querySelectorAll(queryString));

		let els = [];
		this.each(el => els.push(...el.querySelectorAll(queryString)));
		return sq.wrap(els);
	},

	children: function (filter) {
		if (!filter)
			return sq.wrap(this[0].children);

		return this.find(filter);
	},

	parent: function () {
		let parents = [];
		this.each(el => parents.push(el.parentElement));

		return sq.wrap(parents);
	},

	on: function (event, fn, preventDefault) {
		let fnHandler = function (fn, el, noDefault, e) {
			e.target = el;
			requestAnimationFrame(fn.bind(null, e));

			if (noDefault) {
				e.preventDefault();
				return false;
			}
		};

		this.each(el => el.addEventListener(event, fnHandler.bind(null, fn, el, preventDefault)));

		return this;
	},

	off: function () {
		let newNodes = [];

		this.each(el => {
			let newNode = el.cloneNode(true);
			el.parentNode.replaceChild(newNode, el);
			newNodes.push(newNode);
		});

		return this.wrap(newNodes);
	},

	clone: function () {
		let newNode = this[0].cloneNode(true);
		return this.wrap([newNode]);
	},

	each: function (fn) {
		const len = this.length;
		for (let i = 0; i < len; i++) 
			fn(this[i]);
	},

	appendTo: function (el) {
		if (typeof(el) === 'string')
			el = sq.find(el)[0];
		else
			el = el.on ? el[0] : el;

		this.each(c => el.appendChild(c));
		return this;
	},

	prependTo: function (el) {
		el[0].insertBefore(this[0], el.children()[0]);
		return this;
	},

	remove: function () {
		this.each(el => el.remove());	
	},

	addClass: function (classNames) {
		if (classNames)
			classNames.split(' ').forEach(c => this.each(el => el.classList.add(c)));
		return this;
	},

	removeClass: function (classNames) {
		classNames.split(' ').forEach(c => this.each(el => el.classList.remove(c)));
		return this;
	},

	hasClass: function (className) {
		return this[0].classList.contains(className);
	},

	toggleClass: function (className) {
		this.hasClass(className) ? this.removeClass(className) : this.addClass(className);
	},

	show: function () {
		this.each(el => {
			if ($(el).css('display') !== 'none')
				return;

			let newDisplay = el.oldDisplay || 'block';
			delete el.oldDisplay;
			el.attributeStyleMap.set('display', newDisplay);
		});

		return this;
	},

	hide: function () {
		this.each(el => {
			let oldDisplay = $(el).css('display');
			if (oldDisplay !== 'none')
				el.oldDisplay = oldDisplay;
			el.attributeStyleMap.set('display', 'none');
		});
		return this;	
	},

	css: function (property, value) {
		let config = property;
		let aLen = arguments.length;

		if (aLen === 1 && typeof(property) === 'string') {
			let value = this[0].attributeStyleMap.get(property);
			if (!value) {
				let styles = this[0].computedStyleMap();
				value = (styles.get(property) || {});
			}
			return value.value;
		} else if (aLen === 2) {
			config = {
				[property]: value
			};
		}

		Object.keys(config).forEach(c => {
			let val = config[c];
			if (['left', 'top', 'width', 'height'].includes(c) && (!val.indexOf || val.indexOf('%') === -1))
				val += 'px';

			this.each(el => {
				if (val) 
					el.style[c] = val;

				else
					el.attributeStyleMap.delete(c);
			});
		});
		return this;
	},

	empty: function () {
		let node = this[0];
		while (node.firstChild)
		    node.removeChild(node.firstChild);

		return this;
	},

	is: function (state) {
		return (this.width() && this.height());
	},

	html: function (val) {
		if (!arguments.length)
			return this[0].innerHTML;

		this[0].innerHTML = val;
		return this;
	},

	click: function () {
		this[0].click();
		return this;
	},

	next: function () {
		return sq.wrap([this[0].nextSibling]);
	},

	scrollTop: function (value) {
		if (!arguments.length)
			return this[0].scrollTop;
		
		this[0].scrollTop = value;
	},

	val: function (val) {
		if (!arguments.length)
			return this[0].value;

		this[0].value = val;
		return this;
	},

	attr: function (property, value) {
		if (arguments.length === 1)
			return this[0].getAttribute(property);

		this[0].setAttribute(property, value);
		return this;
	},

	insertAfter: function (el) {
		el[0].parentNode.insertBefore(this[0], el[0].nextSibling);
		return this;
	},

	insertBefore: function (el) {
		el[0].parentNode.insertBefore(this[0], el[0]);
		return this;
	},

	index: function () {
		let el = this[0];
		return Array.prototype.indexOf.call(el.parentElement.children, el);
	},

	offset: function () {
		return this[0].getBoundingClientRect();
	},

	data: function (property, value) {
		let dataSet = sqData.get(this[0]);
		if (!dataSet) {
			dataSet = {};
			sqData.set(this[0], dataSet);
		}		

		if (arguments.length === 1)
			return dataSet[property];

		dataSet[property] = value;

		return this;
	},

	removeData: function (property) {
		if (this.dataSet)
			delete this.dataSet[property];

		return this;
	},

	wrap: function (els) {
		let res = {
			length: els.length
		};

		Object.keys(sq)
			.forEach(k => res[k] = sq[k].bind(res));

		for (let i = 0; i < els.length; i++) 
			res[i] = els[i];

		return res;
	},

	width: function (val) {
		if (val) {
			this.css('width', val);
			return this;
		}

		return this[0].offsetWidth;
	},

	height: function (val) {
		if (val) {
			this.css('height', val);
			return this;
		}

		return this[0].offsetHeight;
	},

	eq: function (index) {
		return sq.wrap([this[index]]);
	},

	focus: function () {
		this[0].focus();
		return this;
	},

	blur: function () {
		this[0].blur();
		return this;
	},

	cloneRecursive: function (o, newO) {
		if (typeof o !== 'object') 
			return o;
	    
		if (!o) 
			return o;
	 
		if (o instanceof Array) {
			if (!newO || !newO.push)
				newO = [];

			for (let i = 0; i < o.length; i++) 
				newO[i] = sq.cloneRecursive(o[i], newO[i]);
	      
			return newO;
		}

		if (!newO || typeof(newO) !== 'object')
			newO = {};
		for (let i in o) {
			if (o.hasOwnProperty(i)) 
				newO[i] = sq.cloneRecursive(o[i], newO[i]);
		}
		return newO;
	},

	extend: function (temp, o) {
		let aLen = arguments.length;
		for (let i = 2; i < aLen; i++) 
			sq.cloneRecursive(arguments[i], o);

		return o;
	}
};

window.$ = sq.default.bind(sq);

Object.keys(sq).forEach(k => window.$[k] = sq[k].bind(sq));
