/**
 * Created by Ashish Lamse on 29/11/16.
 */

/**
 * Get advice by advice id
 * @param response
 * @returns {shaded object}
 */
var shadedResponse=function shadedResponse(response){
    if(typeof response==='object')    {
        for (var property in response) {
            if(typeof response[property]==='object'){
                response[property] = shadedResponse(response[property]);
            }
            else {
                if(property==="authToken"){
                    delete response[property]
                }
                else if(property==="password"){
                    delete response[property]
                }
                else if(property==="passcode"){
                    delete response[property]
                }
                else if(property==="__v"){
                    delete response[property]
                }

            }
        }
    }
    return response;

}
module.exports=shadedResponse;