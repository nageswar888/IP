package com.example.lenovo.ipaas_1;

/**
 * Created by Arun on 12/1/2016.
 */

import android.app.DatePickerDialog;
import android.app.Dialog;
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
import android.view.MotionEvent;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.DatePicker;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.Field;
import java.text.SimpleDateFormat;
import java.util.Collections;
import java.util.GregorianCalendar;
import java.util.ArrayList;
import java.util.Calendar;

public class SearchAdvice extends AppCompatActivity {
    private TextView resultLabel;
    private TextView resultString;
    private EditText fromDate;private EditText toDate;
    String[] statuses = {"Submitted","Level 2 Approved","Level 3 Approved","Disbursed","JDBC","Web services"};
    SharedPreferences sharedPreferences;
    SharedPreferences.Editor editor;
    static String token;
    private Button searchButton;
    private JSONObject searchJson;
    //private AutoCompleteTextView status;
    private AutoCompleteTextView payee;
    private AutoCompleteTextView project;
    static JSONArray payeesJsonArray;
    static JSONArray projectsJsonArray;
    static ArrayList<String> payees;
    static ArrayList<String> projects;
    ProgressBar progressBar;

    @Override
    protected void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_search_advice);
        System.out.println("In search advice");
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        toolbar.setTitle("Search Advice");
        setSupportActionBar(toolbar);
        getSupportActionBar().setDisplayHomeAsUpEnabled(true); // to display the back button on toolbar
        getSupportActionBar().setDisplayShowTitleEnabled(true);

        fromDate = (EditText)findViewById(R.id.fromDate);
        toDate = (EditText)findViewById(R.id.toDate);
        resultLabel = (TextView)findViewById(R.id.result);
        resultString = (TextView)findViewById(R.id.resultString);
        payee = (AutoCompleteTextView) findViewById(R.id.payee);
        project = (AutoCompleteTextView) findViewById(R.id.project);
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
        editor = sharedPreferences.edit();
        token = sharedPreferences.getString("token", null);
        searchButton = (Button) findViewById(R.id.searchButton);
        //status = (AutoCompleteTextView) findViewById(R.id.status);
        //status.setEnabled(false);//fixed value disbursed
        progressBar = (ProgressBar) findViewById(R.id.progressBar);
        progressBar.setVisibility(View.GONE);
        String url = getResources().getString(R.string.url);
        getPayeeResponse(url+"api/payees");
        //getPayeeResponse(getResources().getString(R.string.getPayees_url));
        getProjectsResponse(url+"api/projects");



        payee.setOnKeyListener(new View.OnKeyListener() {

            @Override
            public boolean onKey(View v, int keyCode, KeyEvent event)
            {
                payee.showDropDown();
                //payee.setDropDownAnchor(5);
                return false;
            }

        });

        payee.setOnTouchListener(new View.OnTouchListener(){
            @Override
            public boolean onTouch(View v, MotionEvent event){
                payee.showDropDown();
                //payee.setDropDownAnchor(5);
                return false;
            }
        });
        /*project.setOnFocusChangeListener(new View.OnFocusChangeListener() {

            @Override
            public void onFocusChange(View v, boolean hasFocus) {
                if (hasFocus)
                    project.showDropDown();

            }
        });*/

        project.setOnKeyListener(new View.OnKeyListener() {

            @Override
            public boolean onKey(View v, int keyCode, KeyEvent event)
            {
                project.showDropDown();
                //payee.setDropDownAnchor(5);
                return false;
            }

        });

        project.setOnTouchListener(new View.OnTouchListener() {

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                project.showDropDown();
                return false;
            }
        });


        searchButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                System.out.println("Search button clicked");
                progressBar.setVisibility(View.VISIBLE);
                resultString.setText("");
                //String url = getResources().getString(R.string.search_url);
                String url = getResources().getString(R.string.url);
                String payeeId = getPayeeId(payee.getText().toString());
                System.out.println(project.getText().toString());
                String projectId = getProjectId(project.getText().toString());
                String from = fromDate.getText().toString();
                String to = toDate.getText().toString();
                //String stat = status.getText().toString();
                searchJson = new JSONObject();
                JSONObject q = new JSONObject();
                try
                {
                    q.put("toDate",to);
                    q.put("fromDate",from);
                    q.put("payee",payeeId);
                    q.put("project",projectId);
                    searchJson.put("q",q);
                }
                catch (JSONException e) {
                    e.printStackTrace();
                }
                new HttpAsyncTask1().execute(url+"api/advices/summaryResults/");
            }
        });



        fromDate.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                // pass id here
                showDialog(fromDate.getId());
            }
        });
        toDate.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                // pass id here
                showDialog(toDate.getId());
            }
        });

    }
    @Override
    protected Dialog onCreateDialog(final int id)
    {
        // TODO Auto-generated method stub
        final Calendar cal = Calendar.getInstance();
        DatePickerDialog datePicker = new DatePickerDialog(SearchAdvice.this,new DatePickerDialog.OnDateSetListener()
        {

            @Override
            public void onDateSet(DatePicker view, int year, int monthOfYear,int dayOfMonth)
            {
                EditText edt_Bdate = (EditText)findViewById(id);
                GregorianCalendar fmt = new GregorianCalendar(year, monthOfYear, dayOfMonth);
                SimpleDateFormat df = new SimpleDateFormat("dd-MMM-yyyy");
                String result = df.format(fmt.getTime());
                edt_Bdate.setText(result);
                //System.out.println("Sett date   "+edt_Bdate.getText().toString());
            }
        },cal.get(Calendar.YEAR), cal.get(Calendar.MONTH),
                cal.get(Calendar.DAY_OF_MONTH));
        return datePicker;
    }
    //get the project of id of entered project
    public String getProjectId(String projectName)
    {
        JSONObject jsonObject;
        //System.out.println("projectsJsonArray"+projectsJsonArray);
        for(int i=0;i<projectsJsonArray.length();i++)
        {
            try
            {
                jsonObject = projectsJsonArray.getJSONObject(i);
                //System.out.println("Project Object "+jsonObject);
                if(jsonObject.get("projectName").equals(projectName))
                    return (String) jsonObject.get("_id");
            }
            catch (JSONException e)
            {
                e.printStackTrace();
            }
        }
        return "Not Found2";
    }



    //get the id of payee based on payee name
    public String getPayeeId(String payeeName)
    {
        JSONObject jsonObject;
        //System.out.println("payeesJsonArray"+payeesJsonArray);
        for(int i=0;i<payeesJsonArray.length();i++)
        {
            try
            {
                jsonObject = payeesJsonArray.getJSONObject(i);
                //System.out.println("jsonObject "+jsonObject);
                 if(jsonObject.get("name").equals(payeeName))
                     return (String) jsonObject.get("_id");
            }
            catch (JSONException e)
            {
                e.printStackTrace();
            }

        }
        return "Not Found";
    }

    //get the payees json array from the server
    public void getPayeeResponse(String url)
    {
        new HttpAsyncTask().execute(url);
    }
    //get the projects josn response form server
    public void getProjectsResponse(String url)
    {
        new HttpAsyncTask().execute(url);
    }

    public static void parseProjects(JSONObject jsonObject)
    {
        projects = new ArrayList<String>();
        try
        {
            projectsJsonArray = jsonObject.getJSONArray("data");
            //System.out.println(projectsJsonArray);
            for(int i=0;i<projectsJsonArray.length();i++)
            {
                projects.add(((JSONObject) projectsJsonArray.get(i)).getString("projectName").toString());
            }
            Collections.sort(projects);
        }
        catch (JSONException e)
        {
            e.printStackTrace();
        }
        //System.out.println("Projects "+projects);
    }
    public static void parsePayees(JSONObject jsonObject)
    {
        payees = new ArrayList<String>();
        try
        {
            payeesJsonArray = jsonObject.getJSONArray("data");
            //System.out.println(payeesJsonArray);
            for(int i=0;i<payeesJsonArray.length();i++)
            {
                payees.add(((JSONObject) payeesJsonArray.get(i)).getString("name").toString());
            }
            Collections.sort(payees);
        }
        catch (JSONException e)
        {
            e.printStackTrace();
        }
        //System.out.println("Payees "+payees);
    }


    class HttpAsyncTask1 extends AsyncTask<String, Void, String>
    {


        @Override
        protected String doInBackground(String... urls)
        {
            return HttpRequest.post(urls[0],token,searchJson);
        }

        @Override
        protected void onPostExecute(String result)
        {

            JSONObject jsonObject,data;
            int totalAdvices,total;
            String inWords,res;
            if (result != null || result != "")
            {
                resultLabel.setVisibility(View.VISIBLE);

                System.out.println("Search Result "+result);
                try
                {
                    jsonObject = new JSONObject(result);
                    progressBar.setVisibility(View.GONE);
                    if(jsonObject.get("status").equals("OK"))
                    {
                        if(jsonObject.getJSONObject("data")!=null) {
                            data = jsonObject.getJSONObject("data");

                            totalAdvices = data.getInt("totalAdvices");
                            total = data.getInt("total");
                            inWords = data.getString("totalInWords");
                            res = "There are total " + totalAdvices + "\n" + "amounting to a total of\n" + "Rs. " + total + " " + "(" + inWords + ")";

                            resultString.setVisibility(View.VISIBLE);
                            resultString.setText(res);
                        }
                        else
                        {

                            resultString.setVisibility(View.VISIBLE);
                            resultString.setText("NOT FOUND");
                        }
                    }
                    else {
                        resultString.setVisibility(View.VISIBLE);
                        resultString.setText("NOT FOUND");
                    }
                }
                catch (JSONException e)
                {
                    e.printStackTrace();
                }

            }

        }

    }

    class HttpAsyncTask extends AsyncTask<String, Void, String> {


        @Override
        protected String doInBackground(String... urls)
        {
            return HttpRequest.getAdvices(urls[0], token);
        }

        @Override
        protected void onPostExecute(String result)
        {
            JSONObject jsonObject1, jsonObject2;

            if (result != null || result != "")
            {
                try
                {
                    if (result.contains("projectName"))
                    {
                        jsonObject1 = new JSONObject(result);
                        parseProjects(jsonObject1);
                        autoCompleteProjects();
                    }
                    else if (result.contains("name"))
                    {
                        jsonObject2 = new JSONObject(result);
                        parsePayees(jsonObject2);
                        autoCompletePayee();
                    }

                }
                catch (JSONException e)
                {
                    e.printStackTrace();
                }
                autoCompleteStatus();
            } else
                System.out.println("result empty");


        }

    }




    /*logout action on */
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_login, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_logout)
        {
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

    /*
    public static String post(String url) {

        JSONObject jsonObject = new JSONObject();
        try
        {
            JSONObject q = new JSONObject();
            q.put("toDate",toDate);
            q.put("fromDate",fromDate);
            q.put("payee",payee.getText().toString());
            q.put("Project",project.getText().toString());
            jsonObject.put("q",q);


        }
        catch (JSONException e)
        {
            e.printStackTrace();
        }

        return null;
    }*/


    public void autoCompletePayee() {
        /*payee = (AutoCompleteTextView) findViewById(R.id.payee);*/
        System.out.println("Loading payees" + payees);
        ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, android.R.layout.simple_dropdown_item_1line, payees);
        payee.setAdapter(adapter);
    }
    public void autoCompleteProjects()
    {
        /*project = (AutoCompleteTextView) findViewById(R.id.project);*/
        System.out.println("Loading projects"+projects);
        ArrayAdapter<String> adapter1 = new ArrayAdapter<String>(this, android.R.layout.simple_dropdown_item_1line, projects);
        project.setAdapter(adapter1);

    }
    public void autoCompleteStatus()
    {
        //status = (AutoCompleteTextView) findViewById(R.id.status);

        ArrayAdapter<String> adapter1 = new ArrayAdapter<String>(this, android.R.layout.simple_dropdown_item_1line, statuses);
        //status.setAdapter(adapter1);
        /*project.setOnItemClickListener(new AdapterView.OnItemClickListener()
        {

            @Override
            public void onItemClick(AdapterView<?> arg0, View arg1, int arg2, long arg3) {
                System.out.print("SElected ");
            }
        });*/

    }

}
