var SubscriptionDefinition = function ( topic, callback, emitter ) {
	this.topic = topic;
	this.callback = callback;
	this.context = null;
	this.constraints = [];
	this.emitter = emitter;
};

_.extend(SubscriptionDefinition.prototype, {
	withContext: function(context) {
		this.context = context;
		return this;
	},

  unsubscribe : function () {
    this.emitter._subscriptions[this.topic] = _.without(this.emitter._subscriptions[this.topic], this);
  },

  disposeAfter : function ( maxCalls ) {
    if ( _.isNaN( maxCalls ) || maxCalls <= 0 ) {
      throw "The value provided to disposeAfter (maxCalls) must be a number greater than zero.";
    }
    var self = this;
    var dispose = _.after( maxCalls, function () {
      self.unsubscribe();
    });

    var fn = self.callback;
    self.callback = function() {
      fn.apply(self.context, arguments);
      dispose();
    };

    return self;
  },

  once: function() {
    return this.disposeAfter(1);
  },

	defer : function () {
		var fn = this.callback;
		this.callback = function ( data ) {
			setTimeout( fn, 0, data );
		};
		return this;
	},

	distinctUntilChanged : function () {
		this.withConstraint( new ConsecutiveDistinctPredicate() );
		return this;
	},

	distinct : function () {
		this.withConstraint( new DistinctPredicate() );
		return this;
	},

	withConstraint : function ( predicate ) {
		if ( !_.isFunction( predicate ) ) {
			throw "Predicate constraint must be a function";
		}
		this.constraints.push( predicate );
		return this;
	},

	withConstraints : function ( predicates ) {
		var self = this;
		if ( _.isArray( predicates ) ) {
			_.each( predicates, function ( predicate ) {
				self.withConstraint( predicate );
			} );
		}
		return self;
	},

	withDebounce : function ( milliseconds ) {
		if ( _.isNaN( milliseconds ) ) {
			throw "Milliseconds must be a number";
		}
		var fn = this.callback;
		this.callback = _.debounce( fn, milliseconds );
		return this;
	},

	withDelay : function ( milliseconds ) {
		if ( _.isNaN( milliseconds ) ) {
			throw "Milliseconds must be a number";
		}
		var fn = this.callback;
		this.callback = function ( data ) {
			setTimeout( function () {
				fn( data );
			}, milliseconds );
		};
		return this;
	},

	withThrottle : function ( milliseconds ) {
		if ( _.isNaN( milliseconds ) ) {
			throw "Milliseconds must be a number";
		}
		var fn = this.callback;
		this.callback = _.throttle( fn, milliseconds );
		return this;
	}
});

SubscriptionDefinition.prototype.off = SubscriptionDefinition.prototype.unsubscribe;