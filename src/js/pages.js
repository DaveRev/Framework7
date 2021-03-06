/*======================================================
************   Pages   ************
======================================================*/
// On Page Init Callback
app.pageInitCallback = function(view, pageContainer, url, position) {
    if (pageContainer.f7PageInitialized) return;
    pageContainer.f7PageInitialized = true;
    // Page Data
    var pageData = {
        container: pageContainer,
        url: url,
        query: $.parseUrlQuery(url||''),
        name: $(pageContainer).attr('data-page'),
        view: view,
        from: position
    };
    // Before Init Callback
    if (app.params.onBeforePageInit) {
        app.params.onBeforePageInit(pageData);
    }
    if (view.params.onBeforePageInit) {
        view.params.onBeforePageInit(pageData);   
    }
    app.initPage(pageContainer);
    // Init Callback
    if (app.params.onPageInit) {
        app.params.onPageInit(pageData);
    }
    if (view.params.onPageInit) {
        view.params.onPageInit(pageData);   
    }
};
app.pageReadyCallback = function(view, pageContainer, url, position) {
    // Page Data
    var pageData = {
        container: pageContainer,
        url: url,
        query: $.parseUrlQuery(url||''),
        name: $(pageContainer).attr('data-page'),
        view: view,
        from: position
    };
    // Ready Callback
    if (app.params.onPageReady) {
        app.params.onPageReady(pageData);
    }
    if (view.params.onPageReady) {
        view.params.onPageReady(pageData);   
    }
};
// Init Page Events and Manipulations
app.initPage = function(pageContainer){
    // Prevent Togglers from bubbling AnimationEnd events
    $(pageContainer).find('.switch').on('webkitAnimationEnd OAnimationEnd MSAnimationEnd animationend', function(e){
        e.stopPropagation();
    });
    // Size navbars on page load
    app.sizeNavbars($(pageContainer).parents('.view')[0]);
    app.initSliders(pageContainer);
};
// Load Page
app.allowPageChange = true;
app._tempDomElement = document.createElement('div');
app.loadPage = function (view, url) {
    if (!app.allowPageChange) return false;
    app.allowPageChange = false;
    if (app.xhr) {
        app.xhr.abort();
        app.xhr = false;
    }
    app.get(url, function(data, error){
        if (error) {
            app.allowPageChange = true;
            return;
        }
        var viewContainer = $(view.container),
            newPage, oldPage, pagesInView, i, oldNavbarInner, newNavbarInner, navbar, dynamicNavbar;

        // Parse DOM to find new page
        app._tempDomElement.innerHTML = data;
        newPage = $('.page', app._tempDomElement);
        if (newPage.length>1) {
            newPage = $(app._tempDomElement).find('.view-main .page');
        }

        // If pages not found or there are still more than one, exit
        if (newPage.length===0 || newPage.length>1) {
            app.allowPageChange = true;
            return;
        }
        newPage.addClass('page-on-right');

        // Update View history
        view.history.push(url);

        // Find old page (should be the last one) and remove older pages
        pagesInView = viewContainer.find('.page');
        if (pagesInView.length>1) {
            for (i=0; i<pagesInView.length-2; i++) {
                $(pagesInView[i]).remove();
            }
            $(pagesInView[i]).remove();
        }
        oldPage = viewContainer.find('.page');

        // Dynamic navbar
        if (view.params.dynamicNavbar){
            dynamicNavbar = true;
            // Find navbar
            newNavbarInner = $('.navbar-inner', app._tempDomElement);
            if (newNavbarInner.length>1) {
                newNavbarInner = $('.view-main .navbar-inner', app._tempDomElement);
            }
            if (newNavbarInner.length===0 || newNavbarInner>1) {
                dynamicNavbar = false;
            }
        }
        if (dynamicNavbar) {
            navbar = viewContainer.find('.navbar');
            newNavbarInner.addClass('navbar-on-right');
            oldNavbarInner = navbar.find('.navbar-inner');
            if (oldNavbarInner.length>1) {
                $(oldNavbarInner[0]).remove();
                oldNavbarInner = navbar.find('.navbar-inner');
            }
            navbar.append(newNavbarInner[0]);
        }

        // Append Old Page and add classes for animation
        $(view.pagesContainer).append(newPage[0]);

        // Force reLayout
        var clientLeft = newPage[0].clientLeft;

        // Page Init Events
        app.pageInitCallback(view, newPage[0], url, 'right');
        
        newPage.addClass('page-from-right-to-center');
        oldPage.addClass('page-from-center-to-left').removeClass('page-on-center');

        // Dynamic navbar animation
        if (dynamicNavbar) {
            newNavbarInner.removeClass('navbar-on-right').addClass('navbar-from-right-to-center');
            oldNavbarInner.removeClass('navbar-on-center').addClass('navbar-from-center-to-left');
        }

        newPage.animationEnd(function(e){
            app.allowPageChange = true;
            newPage.toggleClass('page-from-right-to-center page-on-center page-on-right');
            oldPage.toggleClass('page-from-center-to-left page-on-left');
            if (dynamicNavbar) {
                newNavbarInner.toggleClass('navbar-from-right-to-center navbar-on-center');
                oldNavbarInner.toggleClass('navbar-from-center-to-left navbar-on-left');
            }
            app.pageReadyCallback(view, newPage[0], url, 'right');
        });

    });
};
app.goBack = function (view, url, preloadOnly) {
    if (!app.allowPageChange) return false;
    app.allowPageChange = false;
    if (app.xhr) {
        app.xhr.abort();
        app.xhr = false;
    }

    var viewContainer = $(view.container),
        pagesInView = viewContainer.find('.page'),
        oldPage, newPage, oldNavbarInner, newNavbarInner, navbar, dynamicNavbar;
    if (pagesInView.length>1) {
        // Exit if only preloadOnly
        if (preloadOnly) {
            app.allowPageChange = true;
            return;
        }
        // Define old and new pages
        newPage = $(pagesInView[pagesInView.length-2]);
        oldPage = $(pagesInView[pagesInView.length-1]);

        // Dynamic navbar
        if (view.params.dynamicNavbar){
            dynamicNavbar = true;
            // Find navbar
            var inners = viewContainer.find('.navbar-inner');
            newNavbarInner = $(inners[0]);
            oldNavbarInner = $(inners[1]);
        }

        // Add classes for animation
        newPage.removeClass('page-on-left').addClass('page-from-left-to-center');
        oldPage.removeClass('page-on-center').addClass('page-from-center-to-right');

        // Dynamic navbar animation
        if (dynamicNavbar) {
            newNavbarInner.removeClass('navbar-on-left').addClass('navbar-from-left-to-center');
            oldNavbarInner.removeClass('navbar-on-center').addClass('navbar-from-center-to-right');
        }
        
        newPage.animationEnd(function(){
            app.afterGoBack(view, oldPage[0], newPage[0]);
            app.pageReadyCallback(view, newPage[0], url, 'left');
        });
    }
    else {
        if (url && url.indexOf('#') === 0) url = undefined;
        if (view.history.length>1) {
            url = view.history[view.history.length-2];
        }
        if (!url) {
            app.allowPageChange = true;
            return;
        }
        app.get(url, function(data, error){
            if (error) {
                app.allowPageChange = true;
                return;
            }
            // Parse DOM to find new page
            app._tempDomElement.innerHTML = data;
            newPage = $('.page', app._tempDomElement);
            if (newPage.length>1) {
                newPage = $(app._tempDomElement).find('.view-main .page');
            }

            // If pages not found or there are still more than one, exit
            if (newPage.length === 0 || newPage.length>1) {
                app.allowPageChange = true;
                return;
            }
            newPage.addClass('page-on-left');

            // Find old page (should be the only one)
            oldPage = $(viewContainer.find('.page')[0]);

            // Dynamic navbar
            if (view.params.dynamicNavbar){
                dynamicNavbar = true;
                // Find navbar
                newNavbarInner = $('.navbar-inner', app._tempDomElement);
                if (newNavbarInner.length>1) {
                    newNavbarInner = $('.view-main .navbar-inner', app._tempDomElement);
                }
                if (newNavbarInner.length===0 || newNavbarInner>1) {
                    dynamicNavbar = false;
                }
                
            }

            if (dynamicNavbar) {
                navbar = viewContainer.find('.navbar');
                newNavbarInner.addClass('navbar-on-left');
                oldNavbarInner = navbar.find('.navbar-inner');
                if (oldNavbarInner.length>1) {
                    $(oldNavbarInner[0]).remove();
                    oldNavbarInner = navbar.find('.navbar-inner');
                }
                navbar.prepend(newNavbarInner[0]);
            }
            // Prepend new Page and add classes for animation
            $(view.pagesContainer).prepend(newPage[0]);

            // Page Init Events
            app.pageInitCallback(view, newPage[0], url, 'left');

            // Exit if we need only to preload page
            if (preloadOnly) {
                newPage.addClass('page-on-left');
                app.allowPageChange = true;
                return;
            }

            // Force reLayout
            var clientLeft = newPage[0].clientLeft;

            newPage.addClass('page-from-left-to-center');
            oldPage.removeClass('page-on-center').addClass('page-from-center-to-right');

            // Dynamic navbar animation
            if (dynamicNavbar) {
                newNavbarInner.removeClass('navbar-on-left').addClass('navbar-from-left-to-center');
                oldNavbarInner.removeClass('navbar-on-center').addClass('navbar-from-center-to-right');
            }

            newPage.animationEnd(function(){
                app.afterGoBack(view, oldPage[0], newPage[0]);
                app.pageReadyCallback(view, newPage[0], url, 'left');
            });

        });
    }
};
app.afterGoBack = function(view, oldPage, newPage) {
    // Remove old page and set classes on new one
    oldPage = $(oldPage);
    newPage = $(newPage);
    oldPage.remove();
    newPage.removeClass('page-from-left-to-center page-on-left').addClass('page-on-center');
    app.allowPageChange = true;
    // Updated dynamic navbar
    if (view.params.dynamicNavbar) {
        var inners = $(view.container).find('.navbar-inner');
        var oldNavbar = $(inners[1]).remove();
        var newNavbar = $(inners[0]).removeClass('navbar-on-left navbar-from-left-to-center').addClass('navbar-on-center');
    }
    // Update View's Hitory
    view.history.pop();
    // Preload previous page
    if (app.params.preloadPreviousPage) {
        app.goBack(view, false, true);
    }
};