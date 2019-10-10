package com.example.lenovo.ipaas_1;

/**
 * Created by Arun on 11/29/2016.
 */

import android.app.Dialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.AsyncTask;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.view.Window;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.ListAdapter;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import android.os.StrictMode;
import static com.example.lenovo.ipaas_1.R.*;

/* to show the detaisl of each advice*/
public class ShowAdvice extends AppCompatActivity {
    TextView payee,amount,requested_by,project;
    ImageButton nextAdvice,prevAdvice;
    Button approveButton,rejectButton;
    static ArrayList<AdviceObject> arrayList;
    int index; //to catch the position of clicked object
    static String adviceId,adviceStatus;
    static String token;
    final Context context = this;
    SharedPreferences sharedPreferences;
    SharedPreferences.Editor editor;
    ImageView tick;
    Button approvereject;
    TextView paymentAdvice;
    Toolbar toolbar;
    ListAdapter listAdapter;
    ArrayList commnetList;
    ListView listView;
    String  role;
    Button approvePopup;
    ProgressBar spinner;
    @Override
    public void onBackPressed()
    {
        startActivity(new Intent(this, DisplayHome.class));
    }

    @Override
    protected void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        setContentView(layout.activity_show_advice);
        if (android.os.Build.VERSION.SDK_INT > 9) {
            StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
            StrictMode.setThreadPolicy(policy);
        }
        System.out.println(" In Show advice");
        toolbar = (Toolbar) findViewById(id.toolbar);

        toolbar.setTitle("Payment Advices");
        setSupportActionBar(toolbar);
        /*getSupportActionBar().setDisplayShowHomeEnabled(true);
        getSupportActionBar().setIcon(R.drawable.backbutton);*/

        getSupportActionBar().setDisplayHomeAsUpEnabled(true); // to display the back button on toolbar
        getSupportActionBar().setDisplayShowTitleEnabled(true);
        payee = (TextView) findViewById(id.Payee);
        amount = (TextView) findViewById(id.amount);
        requested_by = (TextView) findViewById(id.requested_by);
        project = (TextView) findViewById(id.project);
        nextAdvice = (ImageButton) findViewById(id.nextAdvice);
        prevAdvice = (ImageButton) findViewById(id.previousAdvice);
        approveButton = (Button) findViewById(id.approveButton);
        rejectButton = (Button) findViewById(id.rejectButton);
        paymentAdvice = (TextView) findViewById(id.paymentAdvice);
        spinner = (ProgressBar) findViewById(id.progressBar);
        arrayList = DisplayHome.arrayList;
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
        editor = sharedPreferences.edit();
        token = sharedPreferences.getString("token", null);
        int position = sharedPreferences.getInt("position", 0);
        index = position; //index of a clicked item
        final int noOfAdvices = sharedPreferences.getInt("nofAdvices", 0);
        adviceStatus = sharedPreferences.getString("adviceStatus", null);
        adviceId = sharedPreferences.getString("adviceID", null);
        role = sharedPreferences.getString("roles",null);
        System.out.println("role " +role);
        spinner.setVisibility(View.GONE);
        /*if(role.equals("ROLE_DISBURSER") ||role.contains("ROLE_DISBURSER"))
        {
            approveButton.setText("Disburse");
        }*/
        //paymentAdvice.setText("Payment Advice");



        showAdvice(index, noOfAdvices);

        nextAdvice.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showAdvice(++index, noOfAdvices);
            }
        });
        prevAdvice.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showAdvice(--index, noOfAdvices);
            }
        });

        approveButton.setOnClickListener(
                new View.OnClickListener() {

                    @Override
                    public void onClick(View v) {
                        // approvecustomlayout dialog box
                        System.out.println("Approve Clicked ++++++++++++ \n " + adviceId);
                        final Dialog dialog = new Dialog(context);
                        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
                        dialog.setContentView(layout.approvecustomlayout);
                        //RelativeLayout relativeLayout = (RelativeLayout)dialog.findViewById(R.id.customlayout);
                        final EditText passCode = (EditText) dialog.findViewById(id.passCode);
                        final EditText comment = (EditText) dialog.findViewById(id.comment);
                        approvePopup = (Button) dialog.findViewById(id.approvePopup);
                        /*if(role.equals("ROLE_DISBURSER") ||role.contains("ROLE_DISBURSER"))
                        {
                            approveButton.setText("Disburse");
                        }*/

                        //if button is clicked send the reques to the server
                        approvePopup.setOnClickListener(new View.OnClickListener() {
                            @Override
                            public void onClick(View v) {

                                System.out.println("Approve POP UP ======== \n");
                                spinner.setVisibility(View.VISIBLE);
                                if (passCode.getText().length() == 0 || passCode.getText().equals(null))
                                {
                                    Toast.makeText(ShowAdvice.this, "Enter Passcode", Toast.LENGTH_SHORT).show();
                                }
                                else {
                                    try {
                                        InputStream inputStream = null;
                                        String result = "";
                                        HttpClient httpclient = new DefaultHttpClient();
                                        //String url = getResources().getString(R.string.approve_url);
                                        String url = getResources().getString(string.url);
                                        HttpPut httpPUT = new HttpPut(url +"api/advices/approve/"+ adviceId);
                                        String json = "";
                                        // build jsonObject
                                        JSONObject putJson = new JSONObject();

                                        JSONObject q = new JSONObject();
                                        q.put("passCode", passCode.getText());
                                        q.put("_id", adviceId);
                                        q.put("status", adviceStatus);
                                        q.put("comment", comment.getText().toString());
                                        putJson.put("q", q);
                                        putJson.put("id", adviceId);

                                        json = putJson.toString();// convert JSONObject to JSON to String


                                        StringEntity se = new StringEntity(json);// set json to StringEntity

                                        httpPUT.setEntity(se);// set httpPost Entity
                                        httpPUT.setHeader("Content-type", "application/json");// Set some headers to inform server about the type of the content
                                        httpPUT.setHeader("Auth-token", token);

                                        HttpResponse httpResponse = httpclient.execute(httpPUT);

                                        inputStream = httpResponse.getEntity().getContent();  //receive response as inputStream
                                        //convert inputstream to string
                                        if (inputStream != null)
                                        {
                                            result = HttpRequest.convertInputStreamToString(inputStream);

                                            dialog.dismiss();

                                        }
                                        else
                                            result = "Did not work!";
                                        JSONObject jsonObject = new JSONObject(result);
                                        System.out.println("after approve "+ result);
                                        if (jsonObject.get("status").equals("OK"))
                                        {
                                            afterApproveReject("Approved");
                                        }
                                        else if (jsonObject.get("status").equals("FAILED"))
                                        {
                                            Toast.makeText(ShowAdvice.this, "Passcode not matching", Toast.LENGTH_SHORT).show();
                                        }
                                        spinner.setVisibility(View.GONE);
                                    } catch (Exception e) {
                                        //e.printStackTrace();
                                        System.out.println(e.getMessage());
                                        e.printStackTrace();
                                        //Log.d("InputStream", e.getLocalizedMessage());
                                    }
                                }


                            }
                        });


                        Button cancelPopup = (Button) dialog.findViewById(id.cancelPopup);
                        // if button is clicked, close the approvecustomlayout dialog
                        cancelPopup.setOnClickListener(new View.OnClickListener() {
                            @Override
                            public void onClick(View v) {

                                dialog.dismiss();
                            }
                        });

                        dialog.show();
                    }

                });


        rejectButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                final Dialog dialog1 = new Dialog(context);
                dialog1.requestWindowFeature(Window.FEATURE_NO_TITLE);
                dialog1.setContentView(layout.rejectcustomlayout);

                final EditText passCode = (EditText) dialog1.findViewById(id.passCode);
                Button rejectPopup = (Button) dialog1.findViewById(id.rejectPopup);
                Button cancel = (Button) dialog1.findViewById(id.cancelPopup);
                final EditText comment = (EditText) dialog1.findViewById(id.comment);
                rejectPopup.setOnClickListener(
                        new View.OnClickListener() {

                            @Override
                            public void onClick(View v) {
                                spinner.setVisibility(View.VISIBLE);
                                HttpClient httpClient = new DefaultHttpClient();
                                String url = getResources().getString(string.url);
                                //String url = getResources().getString(R.string.reject_url);
                                HttpPut httpPut = new HttpPut(url + "api/advices/reject/"+adviceId);

                                String json;
                                String result = null;
                                InputStream inputStream = null;
                                // set json to StringEntity
                                StringEntity se = null;
                                if (passCode.getText().length() == 0 || passCode.getText().equals(null)) {
                                    Toast.makeText(ShowAdvice.this, "Enter Passcode", Toast.LENGTH_SHORT).show();
                                } else {
                                    try {
                                        JSONObject jsonput = new JSONObject();
                                        JSONObject q = new JSONObject();
                                        q.put("passCode", passCode.getText().toString());
                                        q.put("_id", adviceId);
                                        q.put("status", adviceStatus);
                                        q.put("comment", comment.getText().toString());
                                        jsonput.put("q", q);
                                        jsonput.put("id", adviceId);
                                        // convert JSONObject to JSON to String
                                        json = jsonput.toString();
                                        se = new StringEntity(json);
                                        // set httpPost Entity
                                        httpPut.setEntity(se);
                                        // Set some headers to inform server about the type of the content

                                        httpPut.setHeader("Content-type", "application/json");
                                        httpPut.setHeader("auth-token", token);
                                        // Execute POST request to the given URL

                                        HttpResponse httpResponse = httpClient.execute(httpPut);
                                        inputStream = httpResponse.getEntity().getContent();
                                        //convert inputstream to string
                                        if (inputStream != null) {
                                            result = HttpRequest.convertInputStreamToString(inputStream);

                                        } else
                                            result = "Did not work!";

                                        dialog1.dismiss();
                                        JSONObject jsonObject = new JSONObject(result);
                                        if (jsonObject.get("status").equals("OK")) {
                                            afterApproveReject("Rejected");
                                        } else if (jsonObject.get("status").equals("FAILED")) {
                                            Toast.makeText(ShowAdvice.this, "Passcode not matching", Toast.LENGTH_SHORT).show();
                                        }
                                        spinner.setVisibility(View.GONE);

                                    } catch (UnsupportedEncodingException e) {
                                        e.printStackTrace();
                                    } catch (IOException e) {
                                        e.printStackTrace();
                                    } catch (JSONException e) {
                                        e.printStackTrace();
                                    }
                                }


                            }
                        });
                cancel.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        dialog1.dismiss();
                    }
                });
                dialog1.show();
            }
        });


    }

    public void getComments(String adviceId)
    {
        String url  = getResources().getString(string.url);
        new HttpAsyncTask().execute(url +"api/comments/"+ adviceId);


    }

    public void setCommentsToList()
    {
        listAdapter = new ArrayAdapter<String>(this, R.layout.bullet_row,commnetList);
        listView.setDivider(null);
        listView.setAdapter(listAdapter);
    }

    //set all the values to the screen
    public void showAdvice(int index, int noOfAdvices)
    {
        int ad = index + 1;
        toolbar.setTitle("Payment Advices      " + ad + "/" + noOfAdvices);
        try {
            payee.setText("Payee: " + arrayList.get(index).getName());
            int am = arrayList.get(index).getAmount();
            amount.setText("Rs. " + am);
            try {
                JSONObject jsonObject = arrayList.get(index).getJSONObject();

                if (jsonObject.has("requestedBy") && !jsonObject.get("requestedBy").equals(null))
                {
                    //requested_by = (TextView) findViewById(id.requested_by);
                    requested_by.setText("On the request of " + jsonObject.get("requestedBy"));
                }
                else
                {
                    requested_by.setText("On the request of, Not mentioned");
                }
                JSONObject jsonChild = jsonObject.getJSONObject("project");
                if (jsonChild.has("projectName") && !jsonChild.get("projectName").equals(null))
                {
                    //project = (TextView) findViewById(id.project);
                    project.setText("For Project " + jsonChild.get("projectName"));
                }
                else
                {
                    project.setText("For Project-Not mentioned");
                }
                adviceId = jsonObject.getString("_id");

            } catch (JSONException e) {
                e.printStackTrace();
            }
            getComments(adviceId);//get comments of a particular advice based on adviceID
            enableDisableButtons(noOfAdvices, index); // enable buttons based on the index poistion of pending advice
        }
        catch (Exception e1)
        {
            System.out.println(e1);
            Toast.makeText(ShowAdvice.this, "No More Records to Display ",
                    Toast.LENGTH_LONG).show();

        }
    }

    //enable and disable next and previous buttons
    public void enableDisableButtons(int noOfAdvices, int index) {
        if (index == noOfAdvices - 1 || noOfAdvices <= 1) {
            nextAdvice.setVisibility(View.INVISIBLE);
        } else {
            nextAdvice.setVisibility(View.VISIBLE);

        }
        if (index < 1 || noOfAdvices <= 1) {
            prevAdvice.setVisibility(View.INVISIBLE);
        } else {
            //System.out.println(index + " four " + noOfAdvices);
            prevAdvice.setVisibility(View.VISIBLE);

        }

    }


    public void afterApproveReject(String s) {
        approveButton.setVisibility(View.INVISIBLE);
        rejectButton.setVisibility(View.INVISIBLE);
        prevAdvice.setVisibility(View.INVISIBLE);
        nextAdvice.setVisibility(View.INVISIBLE);
        approvereject = (Button) findViewById(id.approved);
        approvereject.setText(s);
        approvereject.setVisibility(View.VISIBLE);
        tick = (ImageView) findViewById(id.tick);
        int visibility = tick.getVisibility();
        if (visibility == View.VISIBLE) {
            tick.setVisibility(View.GONE);
        } else {
            tick.setVisibility(View.VISIBLE);
        }
        approvereject.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                //finish();
                Intent intent = new Intent(context, DisplayHome.class);
                startActivity(intent);
            }
        });
    }

    public static  String post(String url)
    {
        JSONObject jsonObject = new JSONObject();
        try
        {
            JSONObject q = new JSONObject();
            q.put("adviceId",adviceId);
            jsonObject.put("q",q);
            jsonObject.put("id",adviceId);

        }
        catch (JSONException e)
        {
            e.printStackTrace();
        }
        return HttpRequest.post(url,token,jsonObject);
    }



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
                System.out.println("Show res "+result);
                JSONObject jsonObject;
                JSONArray jsonArray;
                JSONObject jsonChild,jsoninnerchild;
                String text,firstName,lastName,comment;
                try
                {
                    jsonObject = new JSONObject(result);
                    //if(jsonObject.has("data"))
                    {
                        jsonArray = jsonObject.getJSONArray("data");
                        listView = (ListView) findViewById(id.commentsList);
                        commnetList = new ArrayList<String>();
                        if (jsonArray.length() != 0) {

                            for (int i = 0; i < jsonArray.length(); i++) {
                                jsonChild = jsonArray.getJSONObject(i);
                                text = (String) jsonChild.get("text");
                                jsoninnerchild = jsonChild.getJSONObject("user");
                                firstName = (String) jsoninnerchild.get("firstName");
                                lastName = (String) jsoninnerchild.get("lastName");
                                comment = firstName + " " + lastName + " : " + text;
                                System.out.println(comment);
                                commnetList.add(comment);
                            }

                        }
                        else
                        {
                            System.out.println("No Comments");
                            commnetList.add("No Comments");
                        }
                    }
                    /*else
                    {
                        System.out.println("No Comments");
                        commnetList.add("No Comments");
                    }*/
                    setCommentsToList();

                } catch (JSONException e)
                {
                    e.printStackTrace();
                }
            }
            else
            {
                System.out.println("Error in get commnets");
            }
        }
    }
}


