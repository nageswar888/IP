package com.example.lenovo.ipaas_1;

import android.os.AsyncTask;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;

/**
 * Created by Arun on 12/1/2016.
 *
 * To load the payee and project ids from the server to the autocomplete text views in search activity screen
 * Hit the server and parse the json response and create a list of payees and projects
 */

public class LoadAdvices
{

    static String token;
    String url;
    static JSONArray payeesJsonArray;
    static JSONArray projectsJsonArray;
    static ArrayList<String> payees;
    static ArrayList<String> projects;
    public LoadAdvices(String t) {
        token = t;
    }

    /*public void getPayee(String url) {
        new HttpAsyncTask().execute(url);
    }

    public void getProjects(String url) {
        new HttpAsyncTask().execute(url);
    }*/
    public static void parseProjects(JSONObject jsonObject)
    {
        System.out.print(jsonObject);
        projects = new ArrayList<>();
        try
        {
            projectsJsonArray = jsonObject.getJSONArray("data");
            for(int i=0;i<projectsJsonArray.length();i++)
            {
                projects.add(((JSONObject) projectsJsonArray.get(i)).getString("projectName").toString());
            }
        }
        catch (JSONException e)
        {
            e.printStackTrace();
        }
        System.out.println("Projects "+projects);
    }
    public static void parsePayeees(JSONObject jsonObject)
    {
        System.out.print(jsonObject);
        payees = new ArrayList<>();
        try
        {
            payeesJsonArray = jsonObject.getJSONArray("data");
            for(int i=0;i<payeesJsonArray.length();i++)
            {
                payees.add(((JSONObject) payeesJsonArray.get(i)).getString("name").toString());
            }
        }
        catch (JSONException e)
        {
            e.printStackTrace();
        }
        System.out.println("Payees "+payees);
    }




    public  class HttpAsyncTask extends AsyncTask<String, Void, String> {


        @Override
        protected String doInBackground(String... urls)
        {
            return HttpRequest.getAdvices(urls[0], token);
        }

        @Override
        protected void onPostExecute(String result)
        {
            JSONObject jsonObject1, jsonObject2 = null;

            if (result != null || result != "") {
                try {
                    if (result.contains("projectName"))
                    {

                        jsonObject1 = new JSONObject(result);
                        parseProjects(jsonObject1);
                    }
                    else if (result.contains("name"))
                    {
                        jsonObject2 = new JSONObject(result);
                        parsePayeees(jsonObject2);
                    }
                }
                catch (JSONException e)
                {
                    e.printStackTrace();
                }

            } else
                System.out.println("result empty");


        }

    }

}
