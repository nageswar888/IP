
package com.example.lenovo.ipaas_1;
/**
 * Created by Arun on 11/29/2016.
 */

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.AsyncTask;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.AdapterView;
import android.widget.Button;
import android.widget.ListView;
import android.widget.ProgressBar;

import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;

/*Display the list of pending advices*/
public class DisplayHome extends AppCompatActivity
{
    Button pendingButton;
    Button searchButton;
    ListView adviceList;
    public static ArrayList<AdviceObject> arrayList; // to add pending advices to
    static String token;
    String adviceStatus;
    private ProgressBar spinner;
    SharedPreferences sharedPreferences;
    SharedPreferences.Editor editor;

    /*after login if back button is pressed minimise the app*/
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event)
    {

        if(keyCode == KeyEvent.KEYCODE_BACK)
        {
            moveTaskToBack(true);
            return true;
        }

        return false;
        // your other related codes
    }
    @Override
    protected void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_display_home);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        toolbar.setTitle("iPass");
        setSupportActionBar(toolbar);
        /*getSupportActionBar().setDisplayHomeAsUpEnabled(true);*/
        pendingButton = (Button) findViewById(R.id.pendingButton);
        searchButton = (Button) findViewById(R.id.searchButton);
        adviceList = (ListView) findViewById(R.id.listView);
        final Intent intent = getIntent();
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
        editor = sharedPreferences.edit();
        token = sharedPreferences.getString("token", null);

        spinner=(ProgressBar)findViewById(R.id.progressBar);
        spinner.setVisibility(View.GONE);
        spinner.setVisibility(View.VISIBLE);
        //String url = getResources().getString(R.string.fetchAdvices_url);
        String url = getResources().getString(R.string.url);
        new HttpAsyncTask().execute(url+"api/advices/fetchAdvicesByStatus");//to fetch the advices based on the user

        searchButton.setOnClickListener(new View.OnClickListener()
        {
            @Override
            public void onClick(View v)
            {
                Intent intent = new Intent(DisplayHome.this,SearchAdvice.class);
                startActivity(intent);
            }
        });
    }

    //to post the data to server to get all the pending advices for a particular user based on the token
    public static String POST(String url) {
        HttpClient httpClient = new DefaultHttpClient();
        HttpPost httpPost = new HttpPost(url);
        String json;
        String result = null;
        InputStream inputStream = null;
        // set json to StringEntity
        StringEntity se = null;
        try {
            JSONObject jsonObject = new JSONObject();
            JSONObject q = new JSONObject();
            q.put("status", "Pending");
            jsonObject.put("q", q);

            json = jsonObject.toString();
            se = new StringEntity(json);
            // set httpPost Entity
            httpPost.setEntity(se);
            // Set some headers to inform server about the type of the content
            httpPost.setHeader("Content-type", "application/json");
            httpPost.setHeader("Auth-token", token);
            // Execute POST request to the given URL
            HttpResponse httpResponse = httpClient.execute(httpPost);
            inputStream = httpResponse.getEntity().getContent();
            //convert inputstream to string
            if (inputStream != null) {
                result = HttpRequest.convertInputStreamToString(inputStream);

            } else
                result = "Did not work!";
            return result;
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (JSONException e) {
            e.printStackTrace();
        }

        return null;
    }
    /*to add logout action to the tool bar in menu items*/
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_login, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item)
    {
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_logout) {

            System.out.println("Logout clicked");
            Intent myIntent = new Intent(this, LoginActivity.class); //after logout redirect to login
            myIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);// clear back stack
            startActivity(myIntent);

            editor.clear();
            editor.commit();
            finish();
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    //to hit the server asynchronously
    private class HttpAsyncTask extends AsyncTask<String, Void, String> {
        @Override
        protected String doInBackground(String... urls)
        {
            return POST(urls[0]);
        }

        // onPostExecute displays the results of the AsyncTask.
        @Override
        protected void onPostExecute(String result) {
            System.out.println("In display home "+result);
            if (!result.equals(null) || result != "")
            {
                arrayList = new ArrayList<AdviceObject>(); // to add advice objects to list and display

                JSONObject jsonObject = null;
                try {
                    jsonObject = new JSONObject(result);
                    JSONArray jsonArray = (JSONArray) jsonObject.get("data");
                    for (int i = 0; i < jsonArray.length(); i++)
                    {
                        JSONObject jobject = jsonArray.getJSONObject(i);
                        JSONObject jsonChildObject;
                        try
                        {
                            jsonChildObject = (JSONObject) jobject.get("payee");
                            adviceStatus = jobject.get("adviceStatus").toString();
                            //adviceID = (String) jobject.get("_id");
                            if (jsonChildObject != null)
                            {
                                AdviceObject adviceObject = new AdviceObject();
                                adviceObject.setName((String) jsonChildObject.get("name"));
                                adviceObject.setAmount((int) jobject.get("requestedAmount"));
                                adviceObject.setJSONObject(jobject);

                                arrayList.add(adviceObject);
                            }

                        }
                        catch (JSONException e)
                        {
                            e.printStackTrace();
                        }
                        catch (NullPointerException e)
                        {
                            e.printStackTrace();
                        }
                    }


                }
                catch (JSONException e)
                {
                    e.printStackTrace();
                }

                ListViewAdapter adapter = new ListViewAdapter(DisplayHome.this, arrayList); //add the pending advices to adapter with two columns
                adviceList.setAdapter(adapter);
                pendingButton.setText("Pending(" + adviceList.getCount() + ")");
                //on cliking an advice from the listview open the details of advice in other activity
                adviceList.setOnItemClickListener(new AdapterView.OnItemClickListener() {
                    @Override
                    public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                        //on clicking an item from the list view to display the details of and advice
                        Intent intent = new Intent(getApplicationContext(), ShowAdvice.class);
                        //editor.putString("token", jsonObject.getString("token"));
                        editor.putInt("position", position);
                        editor.putInt("nofAdvices", arrayList.size());
                        editor.putString("adviceStatus",adviceStatus);
                        editor.commit();

                        startActivity(intent);
                    }
                });
                spinner.setVisibility(View.GONE);
            }
            else
            {
                System.out.println("Error in Display home");
            }


        }

    }
}