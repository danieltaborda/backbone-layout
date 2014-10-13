/*jshint expr:true */
describe('backbone.layout', function () {

  var View = Backbone.View;
  var ViewA = View.extend({ className: 'view-a' });
  var ViewB = View.extend({ className: 'view-b' });
  var ViewC = View.extend({ className: 'view-c' });
  var ViewCache = View.extend({
    initialize: function () {
      sinon.spy(this, 'remove');
      this.handler = sinon.spy();
      this.listenTo(this, 'my-event', this.handler);
    }
  });
  var ViewEvents = View.extend({
    initialize: function () {
      this.handler = sinon.spy();
    },
    events: {
      click: 'handler'
    }
  });
  var RenderLayout = Backbone.Layout.extend({
    render: function () {
      this.$el.html(templateAB);
      Backbone.Layout.prototype.render.apply(this, arguments);
      return this;
    }
  });
  var template = _.template('<div class="view"></div>');
  var templateAB = _.template('<div class="viewA"></div><div class="viewB"></div>');
  var layout, view, viewA, viewB, viewC;

  /**
   * Helper for element contains.
   */
  function contains (a, b) {
    a = $(a);
    b = $(b);
    return !!a.children().is(b);
  }

  beforeEach(function () {
    layout = new Backbone.Layout();
    view = new View();
    viewA = new ViewA();
    viewB = new ViewB();
    viewC = new ViewC();
  });

  describe('views', function () {
    it('has views array', function () {
      expect(layout.views).to.be.an('array');
    });
  });

  describe('constructor()', function () {
    beforeEach(function () {
      sinon.spy(Backbone, 'View');
    });
    afterEach(function () {
      Backbone.View.restore();
    });
    it('calls parent constructor', function () {
      var options = {};
      new Backbone.Layout(options);
      expect(Backbone.View).to.be.called;
    });
  });

  describe('setView()', function () {
    it('adds view to views', function () {
      layout.setView(view);
      expect(layout.views[0].view).to.eql(view);
    });
    it('attaches view to element', function () {
      layout.setView(view);
      expect(contains(layout.el, view.el)).to.be.true;
    });
    it('attaches view to selector', function () {
      layout.$el.html(template);
      layout.setView(view, '.view');
      expect(contains(layout.$('.view'), view.el)).to.be.true;
    });
    it('attaches views to selectors', function () {
      layout.$el.html(templateAB);
      layout.setView(viewA, '.viewA').setView(viewB, '.viewB');
      expect(contains(layout.$('.viewA'), viewA.el)).to.be.true;
      expect(contains(layout.$('.viewB'), viewB.el)).to.be.true;
    });
    it('replaces view in element', function () {
      sinon.spy(viewA, 'remove');
      layout.setView(viewA).setView(viewB);
      expect(contains(layout.el, viewA.el)).to.be.false;
      expect(contains(layout.el, viewB.el)).to.be.true;
      expect(viewA.remove).to.be.called;
      expect(layout.views).to.have.length(1);
    });
    it('replaces view in selector', function () {
      layout.$el.html(template);
      sinon.spy(viewA, 'remove');
      layout.setView(viewA, '.view').setView(viewB, '.view');
      expect(contains(layout.$('.view'), viewA.el)).to.be.false;
      expect(contains(layout.$('.view'), viewB.el)).to.be.true;
      expect(viewA.remove).to.be.called;
      expect(layout.views).to.have.length(1);
    });
    it('appends view to element', function () {
      layout.$el.html(template);
      layout
        .setView(viewA, null, { append : true })
        .setView(viewB, null, { append : true });
      expect(contains(layout.el, viewA.el)).to.be.true;
      expect(contains(layout.el, viewB.el)).to.be.true;
    });
    it('appends view to selector', function () {
      layout.$el.html(template);
      layout
        .setView(viewA, '.view', { append : true })
        .setView(viewB, '.view', { append : true });
      expect(contains(layout.$('.view'), viewA.el)).to.be.true;
      expect(contains(layout.$('.view'), viewB.el)).to.be.true;
    });
    it('caches view', function () {
      var view = new ViewCache();
      layout
        .setView(view, null, { cache : true })
        .setView(viewA);
      view.trigger('my-event');
      expect(contains(layout.el, view.el)).to.be.false;
      expect(view.remove).not.to.be.called;
      expect(view.handler).to.be.called;
    });
    it('respects options as second argument', function () {
      layout.$el.html(template);
      layout
        .setView(viewA, { append : true })
        .setView(viewB, { append : true });
      expect(contains(layout.el, viewA.el)).to.be.true;
      expect(contains(layout.el, viewB.el)).to.be.true;
    });
    it('calls view event handler', function () {
      var view = new ViewEvents();
      layout.setView(view);
      view.$el.click();
      expect(view.handler).to.be.called;
    });
    it('does not attach view to missing to selector', function () {
      layout.$el.html(template);
      layout.setView(view, '.no-view');
      expect(view.$el.parent()).to.have.length(0);
    });
    it('chains', function () {
      expect(layout.setView(view)).to.equal(layout);
    });
  });

  describe('render()', function () {
    var layout;
    beforeEach(function () {
      layout = new RenderLayout().render();
    });
    it('renders views', function () {
      sinon.spy(view, 'render');
      layout.setView(view).render();
      expect(view.render).to.be.called;
    });
    it('does not render cached views', function () {
      sinon.spy(view, 'render');
      layout.setView(view, null, { cache : true }).render();
      expect(view.render).not.to.be.called;
    });
    it('inserts view in element', function () {
      layout.setView(view).setView(viewA, '.viewA').render();
      expect(contains(layout.el, view.el)).to.be.true;
    });
    it('inserts view in selector', function () {
      layout.setView(viewA, '.viewA');
      layout.render();
      expect(contains(layout.$el.find('.viewA'), viewA.el)).to.be.true;
      expect(layout.views).to.have.length(1);
    });
    it('calls view event handler after render', function () {
      var view = new ViewEvents();
      layout.setView(view).render();
      view.$el.click();
      expect(view.handler).to.be.called;
    });
    it('call super render', function () {
      sinon.spy(Backbone.View.prototype, 'render');
      layout.render();
      expect(Backbone.View.prototype.render).to.be.called;
      Backbone.View.prototype.render.restore();
    });
    it('chains', function () {
      expect(layout.render()).to.equal(layout);
    });
  });

  describe('remove()', function () {
    beforeEach(function () {
      layout.setView(view).render();
    });
    it('removes views', function () {
      view.remove = sinon.spy();
      layout.remove();
      expect(view.remove).to.be.called;
    });
    it('call super remove', function () {
      sinon.spy(Backbone.View.prototype, 'remove');
      layout.remove();
      expect(Backbone.View.prototype.remove).to.be.called;
      Backbone.View.prototype.remove.restore();
    });
    it('chains', function () {
      expect(layout.remove()).to.equal(layout);
    });
  });

  describe('delegateEvents()', function () {
    beforeEach(function () {
      layout.setView(view).render();
    });
    it('delegates events on view', function () {
      sinon.spy(view, 'delegateEvents');
      layout.delegateEvents();
      expect(view.delegateEvents).to.be.called;
    });
    it('call super delegates events', function () {
      sinon.spy(Backbone.View.prototype, 'delegateEvents');
      layout.delegateEvents();
      expect(Backbone.View.prototype.delegateEvents).to.be.called;
      Backbone.View.prototype.delegateEvents.restore();
    });
    it('chains', function () {
      expect(layout.delegateEvents()).to.equal(layout);
    });
  });
});
