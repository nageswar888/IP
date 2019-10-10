package com.example.lenovo.ipaas_1;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.ConnectivityManager;
import android.os.AsyncTask;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.text.Layout;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.Toast;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.JSONException;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;

public class LoginActivity extends AppCompatActivity
{
    private Button loginButton;
    private static EditText userName;
    private static EditText password;
    SharedPreferences sharedPreferences;
    SharedPreferences.Editor editor;
    private ProgressBar spinner;
    @Override
    protected void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        toolbar.setTitle("iPass");
        setSupportActionBar(toolbar);
        /*getSupportActionBar().setDisplayHomeAsUpEnabled(true);//back button on tool bar*/

        loginButton = (Button)findViewById(R.id.loginButton);
        userName = (EditText)findViewById(R.id.username);
        password = (EditText)findViewById(R.id.password);

        /*LayoutInflater inflater = (LayoutInflater)getSystemService(Context.LAYOUT_INFLATER_SERVICE);
        RelativeLayout rl = (RelativeLayout) findViewById(R.id.progresslayout);
        View progressView = inflater.inflate(R.layout.progress_bar, null); //log.xml is your file.
        spinner = (ProgressBar)progressView.findViewById(R.id.progressBar);*/
        spinner=(ProgressBar)findViewById(R.id.progressBar);
        spinner.setVisibility(View.GONE);

        //to Keep user token  in session until logout
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
        editor = sharedPreferences.edit();
        //on clicking login hits the server and gets response
        loginButton.setOnClickListener(new View.OnClickListener()
        {

            @Override
            public void onClick(View v)
            {
                System.out.println("CLICKED LOGIN");
                spinner.setVisibility(View.VISIBLE);
                boolean connStatus = isNetworkConnected();
                if(connStatus==true)
                {
                    String url = getResources().getString(R.string.url);
                    //String url = getResources().getString(R.string.login_url);
                    new HttpAsyncTask().execute(url+"login");
                }
                else
                {
                    Toast.makeText(LoginActivity.this, "No Internetconnection/server is down ",Toast.LENGTH_LONG).show();
                }
            }
        });
    }
    //to check if connected to internet
    private boolean isNetworkConnected()
    {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        return cm.getActiveNetworkInfo() != null;
    }
    //mehtod to make post request to server with username ans possword
    public static  String post(String url)
    {
        JSONObject jsonObject = new JSONObject();
        try
        {
            jsonObject.put("username",userName.getText());
            jsonObject.put("password",password.getText());
        }
        catch (JSONException e)
        {
            e.printStackTrace();
        }
        return HttpRequest.post(url,jsonObject);
}

    //to hit the server asynchronously
    private class HttpAsyncTask extends AsyncTask<String, Void, String>
    {
        @Override
        protected String doInBackground(String... urls)
        {
            return post(urls[0]);
        }
        // onPostExecute displays the results of the AsyncTask.
        @Override
        protected void onPostExecute(String result)
        {

            if(result!=null||result!="")
            {
                JSONObject jsonObject;
                try
                {
                    jsonObject = new JSONObject(result);
                    if(jsonObject.has("token"))
                    {
                        JSONObject jsonChild = jsonObject.getJSONObject("user");
                        User user = new User();
                        user.setToken(jsonObject.getString("token").toString());
                        user.setId(jsonChild.getString("_id"));
                        user.setFirstName(jsonChild.getString("firstName"));
                        user.setLastName(jsonChild.getString("lastName"));
                        user.setEmail(jsonChild.getString("email"));
                        user.setRoles(jsonChild.getJSONArray("roles"));
                        user.setIsAuthenticated(jsonObject.getString("isAuthenticated"));
                        System.out.println("USER "+user);
                        editor.putString("token", jsonObject.getString("token")); //pushing token into shared preferences to maintain sessions
                        editor.putString("roles",jsonChild.getJSONArray("roles").toString());
                        editor.commit();
                        Intent intent = new Intent(LoginActivity.this, DisplayHome.class);
                        startActivity(intent);
                        spinner.setVisibility(View.GONE);//after login spinner should disappear
                    }
                    else if (jsonObject.has("status"))
                    {
                        spinner.setVisibility(View.GONE);//if login fails
                        Toast.makeText(LoginActivity.this, jsonObject.get("messages").toString(),
                                Toast.LENGTH_LONG).show();
                    }
                } catch (JSONException e)
                {
                    Toast.makeText(LoginActivity.this, "Server Down",Toast.LENGTH_LONG).show();
                    e.printStackTrace();
                }
            }
            else
            {
                Toast.makeText(LoginActivity.this, "Server is down ",
                        Toast.LENGTH_LONG).show();
            }
        }
    }
}
