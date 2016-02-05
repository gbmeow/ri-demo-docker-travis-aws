module.exports = function(ngModule) {
  describe(`homeCtrl`, function() {
      var ctrl;
      beforeEach(function() {
          window.module(ngModule.name);
      });
      beforeEach(inject(function($controller) {
          ctrl = $controller('HomeCtrl');
      }));
      
      it('should give us a label', function() {
        expect(ctrl.label).to.equal('Good Label');
      });
      
       it('should give us a name', function() {
        expect(ctrl.name).to.equal('Johnny');  
      });
  });
}