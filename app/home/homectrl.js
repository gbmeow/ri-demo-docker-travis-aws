module.exports = function($http) { 
    this.load = function() {
        var that = this;
        that.name = 'Johnny';
        that.label = 'Good Label';
        $http({
			method: 'GET',
			url: '/api/instructors'
			}).then(function(res) {
				that.populateInstructors(res.data);
			});
    }
    
	this.addLike = function(id) {
        var that = this;
			$http.post('/api/instructors/' + id).then(function(res) {
                that.populateInstructors(res.data);
			});
	}
    
    this.populateInstructors = function(data) {
        this.instructors = data;
    }
    
    this.load();
	
}