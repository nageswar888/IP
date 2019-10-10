/**
 * Created by sukesh on 1/11/16.
 */
function partialRoute(req, res) {
    res.render( 'partials/' + req.name );
}

module.exports = partialRoute;
