package com.example.lenovo.ipaas_1;

import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;

/**
 * Created by Arun on 11/29/2016.
 */

public class HttpRequest
{

    public static  String getAdvices(String url,String token)
    {
        //System.out.println("in  http request class"+url);
        InputStream inputStream = null;
        String result = "";
        HttpClient httpclient = new DefaultHttpClient();
        HttpGet httpGet = new HttpGet(url);
        httpGet.setHeader("Auth-token", token);

        HttpResponse httpResponse = null;
        try
        {
            httpResponse = httpclient.execute(httpGet);
            inputStream = httpResponse.getEntity().getContent();  //receive response as inputStream

            if(inputStream != null)
            {
                result = convertInputStreamToString(inputStream);
            }
            else
                System.out.println("Did not work");
        }
        catch (IOException e)
        {
            e.printStackTrace();
        }
        catch (JSONException e) {
            e.printStackTrace();
        }
        return result;
    }

    public static  String post(String url,JSONObject jsonObject)
    {
        HttpClient httpClient = new DefaultHttpClient();
        HttpPost httpPost = new HttpPost(url);
        String json;
        String result = null;
        InputStream inputStream = null;
        // set json to StringEntity
        StringEntity se = null;
        try
        {
            // convert JSONObject to JSON to String
            json = jsonObject.toString();
            System.out.println("\n"+json);
            se = new StringEntity(json);
            // set httpPost Entity
            httpPost.setEntity(se);
            // Set some headers to inform server about the type of the content

            httpPost.setHeader("Content-type", "application/json");
            // Execute POST request to the given URL

            HttpResponse httpResponse = httpClient.execute(httpPost);
            inputStream = httpResponse.getEntity().getContent();
            //convert inputstream to string

            if(inputStream != null)
            {
                result = convertInputStreamToString(inputStream);

            }

            else
                result = "Did not work!";
            //System.out.println(result+" ************************** +++++++++++++++++++ ");

        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        catch (IOException e) {
            e.printStackTrace();
        } catch (JSONException e) {
            e.printStackTrace();
        }

        return result;
    }


    public static  String post(String url,String token,JSONObject jsonObject)
    {
        System.out.println("url"+url);
        HttpClient httpClient = new DefaultHttpClient();
        HttpPost httpPost = new HttpPost(url);
        String json;
        String result = null;
        InputStream inputStream = null;
        // set json to StringEntity
        StringEntity se = null;
        try
        {
            // convert JSONObject to JSON to String
            json = jsonObject.toString();
            System.out.println("\n"+json);
            se = new StringEntity(json);
            // set httpPost Entity
            httpPost.setEntity(se);
            // Set some headers to inform server about the type of the content

            httpPost.setHeader("Content-type", "application/json");
            httpPost.setHeader("auth-token",token);

            // Execute POST request to the given URL

            HttpResponse httpResponse = httpClient.execute(httpPost);
            inputStream = httpResponse.getEntity().getContent();
            //convert inputstream to string

            if(inputStream != null)
            {
                result = convertInputStreamToString(inputStream);

            }

            else
                result = "Did not work!";
            //System.out.println(result+" ************************** +++++++++++++++++++ ");

        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        catch (IOException e) {
            e.printStackTrace();
        } catch (JSONException e) {
            e.printStackTrace();
        }

        return result;
    }

    //convert the input stream to string
    public static String convertInputStreamToString(InputStream inputStream) throws IOException, JSONException
    {
        BufferedReader bufferedReader = new BufferedReader( new InputStreamReader(inputStream));
        String line = "";
        String result = "";

        //read the json response
        while ((line = bufferedReader.readLine()) != null)
        {
            result+=line; //reading the data and appending to result string
        }
        inputStream.close();

        return result;
    }

}
