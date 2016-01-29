//define a class for permission viewer tree view
(function ($) { //an IIFE so safely alias jQuery to $
    $.Treeview = function (element) { //renamed arg for readability

        //stores the passed element as a property of the created instance.
        //This way we can access it later
        this.containerElement = (element instanceof $) ? element : $(element);
        //instanceof is an extremely simple method to handle passed jQuery objects,
        //DOM elements and selector strings.
        //This one doesn't check if the passed element is valid
        //nor if a passed selector string matches any elements.
    };

    $.Treeview.defaultOptions = {
        initialState:'collapsed', 
    	expanderTemplate: '<span class="treeview-expander"></span>',
    	indentTemplate: '<span class="treeview-indent"></span>',
    	expanderExpandedClass: 'glyphicon glyphicon-chevron-down',
    	expanderCollapsedClass: 'glyphicon glyphicon-chevron-right',
    	templateClass: /treeview-([A-Za-z0-9_-]+)/,
		templateParentClass: /treeview-parent-([A-Za-z0-9_-]+)/,
		rootNodeClass: 'rootNode',
		folderNodeClass: 'folderNode',
		leafNodeClass: 'leafNode',
		tableId: ''
    };

    //assigning an object literal to the prototype is a shorter syntax
    //than assigning one property at a time
    $.Treeview.prototype = {
        InitTreeview: function() {
            //`this` references the instance object inside of an instace's method,
            //however `this` is set to reference a DOM element inside jQuery event
            //handler functions' scope. So we take advantage of JS's lexical scope
            //and assign the `this` reference to another variable that we can access
            //inside the jQuery handlers
            
			var context = this;
			$.Treeview.defaultOptions.tableId = this.containerElement.attr("id");

            var rootNodes = context.getRootNodes();
            context.render(context.initNodes(rootNodes));
        },

        /**
		 * initiate nodes
		 * @parameter: [nodes]
		 * @returns: [nodes]
		 */
        initNodes: function(nodes) {
            return $(nodes).each(function() {
                var $this = $(this);
                $.Treeview.prototype.initNodes($.Treeview.prototype.getChildNodes($this));
                $.Treeview.prototype.initState($.Treeview.prototype.initIndent($.Treeview.prototype.initExpander($this)));
            });
        },

        /**
		 * initiate indent for nodes
		 * @parameter: current node
		 * @returns: current node
		 */
        initIndent: function($currentNode) {
            $currentNode.find('.treeview-indent').remove();
            var expander = $currentNode.find('.treeview-expander');
            var depth = $.Treeview.prototype.getDepth($currentNode);
            for (var i = 0; i < depth; i++) {
                $($.Treeview.defaultOptions.indentTemplate).insertBefore(expander);
            }
            return $currentNode;
        },

        /**
		 * initiate expanders for nodes
		 * @parameter: current node, type: jquery object
		 * @returns: current node
		 */
        initExpander: function ($currentNode) {
		    var cell = $currentNode.find('td').get('0');
		    var expander = $.Treeview.prototype.getExpander($currentNode);
		    if (expander) {
		        $(expander).remove();
		    }
		    //add expander
		    $($.Treeview.defaultOptions.expanderTemplate).prependTo(cell);
		    return $currentNode;
		},

		/**
		 * initiate state with default options
		 * @parameter [nodes]
		 * @returns [Nodes]
		 */
		initState: function($currentNode) {
            if ($.Treeview.defaultOptions.initialState === "expanded") {
               $.Treeview.prototype.expand($currentNode);
            } else {
                $.Treeview.prototype.collapse($currentNode);
            }
            return $currentNode;
        },

        /**
		 * render nodes
		 * @parameter [nodes]
		 * @returns [Nodes]
		 */
        render: function(nodes) {
            return $(nodes).each(function() {
                var $this = $(this);
                //if parent colapsed we hidden
                if ($.Treeview.prototype.isOneOfParentsCollapsed($this)) {
                    $this.hide();
                } else {
                    $this.show();
                }
                if (!$.Treeview.prototype.isLeaf($this)) {
                    $.Treeview.prototype.renderExpander($this);
                    $.Treeview.prototype.render($.Treeview.prototype.getChildNodes($this));
                }
            });
        },

        /**
		 * Check whether one of parents node is collapsed
		 * @parameter {jquery object}
		 *
		 */
        isOneOfParentsCollapsed: function($currentNode) {
            if ($.Treeview.prototype.isRoot($currentNode)) {
                return false;
            } else {
                if ($.Treeview.prototype.isCollapsed($.Treeview.prototype.getParentNode($currentNode))) {
                    return true;
                } else {
                    return $.Treeview.prototype.isOneOfParentsCollapsed($.Treeview.prototype.getParentNode($currentNode));
                }
            }
        },
        
        /**
		 * Get all nodes
		 * @parameter {jquery object for table}
		 * @returns {Nodes}
		 */
		getAllNodes: function() {
		    var result = $.grep($.Treeview.prototype.getTreeviewContainerById($.Treeview.defaultOptions.tableId).find('tr'), function (element) {
		        var classNames = $(element).attr('class');
		        //var templateClass = /treeview-([A-Za-z0-9_-]+)/;
		        return $.Treeview.defaultOptions.templateClass.test(classNames);
		    });
		    return $(result);
		},

		/**
		 * Get all root nodes
		 * @parameter {jquery object for table}
		 * @returns {Nodes}
		 */
		getRootNodes: function() {
		    var result = $.grep($.Treeview.prototype.getTreeviewContainerById($.Treeview.defaultOptions.tableId).find('tr'), function (element) {
		        var classNames = $(element).attr('class');
		        return $(element).hasClass($.Treeview.defaultOptions.rootNodeClass);
		    });
		    return $(result);
		},

		/**
		 * Get tree grid container
		 * @parameter {}
		 * @returns {jquery object}
		 */
		getTreeviewContainer: function($currentNode) {
		    return $currentNode.closest('table');
		},

		/**
		 * Get tree grid container by id
		 * @parameter {}
		 * @returns {jquery object}
		 */
		getTreeviewContainerById: function(tableId){
			return $("#"+ tableId);
		},

		/**
		 * Get all child nodes
		 * @parameter {parent node}
		 * @returns [nodes]
		 */
		getChildNodes: function($currentNode) {
		    var templateClass = "treeview-parent-" + $.Treeview.prototype.getNodeId($currentNode);
		    return $.Treeview.prototype.getTreeviewContainer($currentNode).find('tr.' + templateClass);
		},

		/**
		 * Get node by id
		 * @parameter [id of parent node, table object]
		 * @returns [nodes]
		 */
		getNodeById: function(id) {
		    var templateClass = "treeview-" + id;
		    return $.Treeview.prototype.getTreeviewContainerById($.Treeview.defaultOptions.tableId).find('tr.' + templateClass);
		},

		/**
		 * Get id of current node
		 * @parameter {}
		 * @returns node id or null;
		 */
		getNodeId: function($currentNode) {
		    //var template = /treeview-([A-Za-z0-9_-]+)/;
		    if ($.Treeview.defaultOptions.templateClass.test($currentNode.attr('class'))) {
		        return $.Treeview.defaultOptions.templateClass.exec($currentNode.attr('class'))[1];
		    }
		    return null;
		},

		/**
		 * Get id of parent node
		 * @parameter [id of parent node, table object]
		 * @returns string;
		 */
		getParentNodeId: function($currentNode) {
		    //var template = /treeview-parent-([A-Za-z0-9_-]+)/;
		    if ($.Treeview.defaultOptions.templateParentClass.test($currentNode.attr('class'))) {
		        return $.Treeview.defaultOptions.templateParentClass.exec($currentNode.attr('class'))[1];
		    }
		    return null;
		},

		/**
		 * Get parent node
		 * @parameter [current node object]
		 * @returns jquery object;
		 */
		getParentNode: function($currentNode) {
		    if ($.Treeview.prototype.getParentNodeId($currentNode) === null) {
		        return null;
		    } else {
		        return $.Treeview.prototype.getNodeById($.Treeview.prototype.getParentNodeId($currentNode));
		    }
		},

		/**
         * Check whehter current node is a root node
         *
         * @parameter: current node, type: jquery object
         */
		isRoot: function($currentNode) {
		    return $currentNode.hasClass("rootNode");
		},

		/**
         * Check whehter current node is a folder
         *
         * @parameter: current node, type: jquery object
         */
		isFolder: function($currentNode) {
		    return $currentNode.hasClass("folderNode");
		},

		/**
         * Check whehter current node is a leaf
         *
         * @parameter: current node, type: jquery object
         */
		isLeaf: function($currentNode) {
		    return !$currentNode.hasClass("rootNode") && !$currentNode.hasClass("folderNode");
		},

		/**
         * get number of levels of current node
         *
         * @parameter: current node, type: jquery object
         */
		getDepth: function($currentNode) {
		    if ($.Treeview.prototype.getParentNodeId($currentNode) === null) {
		        return 0;
		    }
		    return $.Treeview.prototype.getDepth($.Treeview.prototype.getParentNode($currentNode)) + 1;
		},

		/**
         * Check whehter current node is expanded
         *
         * @parameter: current node, type: jquery object
         */
		isExpanded: function($currentNode) {
		    return $currentNode.hasClass('treeview-expanded');
		},

		/**
         * Check whehter current node is collapsed
         *
         * @parameter: current node, type: jquery object
         */
		isCollapsed: function($currentNode) {
		    return $currentNode.hasClass('treeview-collapsed');
		},

		/**
         * expand current node
         *
         * @parameter: current node, type: jquery object
         */
		expand: function($currentNode) {
		    if (!$.Treeview.prototype.isLeaf($currentNode) && !$.Treeview.prototype.isExpanded($currentNode)) {
		        $currentNode.removeClass('treeview-collapsed');
		        $currentNode.addClass('treeview-expanded');
		        $.Treeview.prototype.render($currentNode);
		    }
		},

		/**
         * Collapse current node
         *
         * @parameter: current node, type: jquery object
         */
		collapse: function($currentNode) {
		    if (!$.Treeview.prototype.isLeaf($currentNode) && !$.Treeview.prototype.isCollapsed($currentNode)) {
		        $currentNode.removeClass('treeview-expanded');
		        $currentNode.addClass('treeview-collapsed');
		        $.Treeview.prototype.render($.Treeview.prototype.collapseRecursive($currentNode));
		    }
		},
		/**
         * Collapse all child nodes begin from current
         *
         * @returns {Node}
         */
        collapseRecursive: function($currentNode) {
            if (!$.Treeview.prototype.isLeaf($currentNode)) {
            	$.each($.Treeview.prototype.getChildNodes($currentNode), function(){
            		$(this).removeClass('treeview-expanded');
		        	$(this).addClass('treeview-collapsed');
            		$.Treeview.prototype.collapseRecursive($(this));
            	});
            }
            return $currentNode;
        },

		//get expander object of current node
		// parameter: current Node, type: jquery object
		getExpander: function($currentNode) {
		    return $currentNode.find('.treeview-expander').get(0);
		},

		//render expander for each node
		// parameter: current Node, type: jquery object
		renderExpander: function($currentNode) {
		    var expander = $.Treeview.prototype.getExpander($currentNode);
		    if (expander) {

		        if (!$.Treeview.prototype.isCollapsed($currentNode)) {
		            $(expander).removeClass($.Treeview.defaultOptions.expanderCollapsedClass);
		            $(expander).addClass($.Treeview.defaultOptions.expanderExpandedClass);
		        } else {
		            $(expander).removeClass($.Treeview.defaultOptions.expanderExpandedClass);
		            $(expander).addClass($.Treeview.defaultOptions.expanderCollapsedClass);
		        }
		    } else {
		        $.Treeview.prototype.initExpander($currentNode);
		        $.Treeview.prototype.renderExpander($currentNode);
		    }
		},

		//toggle event of expanders
		// parameter: current Node, type: jquery object
		toggle: function($currentNode) {
		    if ($.Treeview.prototype.isExpanded($currentNode)) {
		        $.Treeview.prototype.collapse($currentNode);
		    } else {
		        $.Treeview.prototype.expand($currentNode);
		    }
		}
    };

}(jQuery));